import { db, auth } from '../firebase.js'

export function useFirebase() {
  return { auth, db }
}