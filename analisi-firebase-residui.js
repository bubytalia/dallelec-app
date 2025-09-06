// Analisi completa dei residui Firebase nel codice
import fs from 'fs';
import path from 'path';

const srcDir = './src';
const firebasePatterns = [
    // Import Firebase
    /import.*firebase/gi,
    /from.*firebase/gi,
    /import.*firestore/gi,
    /from.*firestore/gi,
    
    // Firebase functions
    /getDoc\(/gi,
    /getDocs\(/gi,
    /doc\(/gi,
    /collection\(/gi,
    /addDoc\(/gi,
    /updateDoc\(/gi,
    /deleteDoc\(/gi,
    /onSnapshot\(/gi,
    /query\(/gi,
    /where\(/gi,
    /orderBy\(/gi,
    
    // Firebase database references
    /\.db\b/gi,
    /firebase\.db/gi,
    /firestore\(/gi,
    
    // Firebase auth
    /getAuth\(/gi,
    /signInWithEmailAndPassword/gi,
    /signOut\(/gi,
    /onAuthStateChanged/gi,
    
    // Firebase storage
    /getStorage\(/gi,
    /uploadBytes/gi,
    /getDownloadURL/gi,
    
    // Firebase config
    /firebase_id/gi,
    /firebaseConfig/gi,
    /initializeApp/gi
];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const findings = [];
        
        firebasePatterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const lines = content.split('\n');
                    lines.forEach((line, lineNum) => {
                        if (line.includes(match)) {
                            findings.push({
                                file: filePath,
                                line: lineNum + 1,
                                match: match,
                                context: line.trim(),
                                pattern: pattern.toString()
                            });
                        }
                    });
                });
            }
        });
        
        return findings;
    } catch (error) {
        console.error(`Errore lettura file ${filePath}:`, error.message);
        return [];
    }
}

function scanDirectory(dir) {
    const results = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules, .git, dist, etc.
                if (!['node_modules', '.git', 'dist', 'build', '.nuxt'].includes(item)) {
                    results.push(...scanDirectory(fullPath));
                }
            } else if (stat.isFile()) {
                // Scan only relevant files
                const ext = path.extname(item).toLowerCase();
                if (['.vue', '.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                    const findings = scanFile(fullPath);
                    results.push(...findings);
                }
            }
        });
    } catch (error) {
        console.error(`Errore scansione directory ${dir}:`, error.message);
    }
    
    return results;
}

function generateReport(findings) {
    console.log('🔍 === ANALISI RESIDUI FIREBASE ===\n');
    
    if (findings.length === 0) {
        console.log('✅ NESSUN RESIDUO FIREBASE TROVATO!');
        return;
    }
    
    // Raggruppa per file
    const byFile = {};
    findings.forEach(finding => {
        if (!byFile[finding.file]) {
            byFile[finding.file] = [];
        }
        byFile[finding.file].push(finding);
    });
    
    console.log(`❌ TROVATI ${findings.length} RESIDUI FIREBASE in ${Object.keys(byFile).length} file:\n`);
    
    // Report dettagliato per file
    Object.keys(byFile).sort().forEach(file => {
        console.log(`📁 ${file}:`);
        byFile[file].forEach(finding => {
            console.log(`   Linea ${finding.line}: ${finding.match}`);
            console.log(`   Contesto: ${finding.context}`);
            console.log('');
        });
        console.log('---\n');
    });
    
    // Sommario per tipo
    console.log('📊 === SOMMARIO PER TIPO ===');
    const byType = {};
    findings.forEach(finding => {
        const type = finding.match.toLowerCase();
        byType[type] = (byType[type] || 0) + 1;
    });
    
    Object.keys(byType).sort().forEach(type => {
        console.log(`${type}: ${byType[type]} occorrenze`);
    });
    
    console.log(`\n🎯 TOTALE: ${findings.length} residui Firebase da convertire`);
}

// Esegui l'analisi
console.log('Avvio scansione Firebase...');
const findings = scanDirectory(srcDir);
generateReport(findings);

// Salva report su file
const reportContent = `ANALISI RESIDUI FIREBASE - ${new Date().toISOString()}

TOTALE RESIDUI: ${findings.length}

DETTAGLIO PER FILE:
${Object.keys(findings.reduce((acc, f) => { acc[f.file] = true; return acc; }, {})).sort().map(file => {
    const fileFindings = findings.filter(f => f.file === file);
    return `${file}:\n${fileFindings.map(f => `  Linea ${f.line}: ${f.match} - ${f.context}`).join('\n')}`;
}).join('\n\n')}
`;

fs.writeFileSync('./firebase-residui-report.txt', reportContent);
console.log('\n📄 Report salvato in: firebase-residui-report.txt');