package com.punchyazilim.kefobaba.data

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Anonim kimlik doğrulama. Firestore kuralları `request.auth != null` istediği için
 * her Firestore işleminden önce oturumun açık olduğundan emin olunur.
 */
@Singleton
class AuthManager @Inject constructor(
    private val auth: FirebaseAuth
) {
    suspend fun ensureSignedIn(): String {
        auth.currentUser?.let { return it.uid }
        val result = auth.signInAnonymously().await()
        return result.user?.uid ?: error("Anonim oturum açılamadı")
    }

    val uid: String? get() = auth.currentUser?.uid
}
