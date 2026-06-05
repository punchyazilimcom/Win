package com.punchyazilim.kefobaba.util

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import java.security.MessageDigest
import java.security.SecureRandom
import javax.inject.Inject
import javax.inject.Singleton

/**
 * PIN yönetimi. PIN düz metin OLARAK SAKLANMAZ; rastgele tuz + SHA-256 ile hash'lenir
 * ve EncryptedSharedPreferences içinde tutulur. Aynı hash Firestore aile dökümanına da
 * senkronlanabilir (kaldırma korumasında çocuk cihaz yerel doğrulama yapsın diye).
 */
@Singleton
class PinManager @Inject constructor(
    @ApplicationContext context: Context
) {
    private val prefs by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "kefo_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun isPinSet(): Boolean = prefs.contains(KEY_HASH) && prefs.contains(KEY_SALT)

    /** Yeni PIN belirler (yalnızca ebeveyn). */
    fun setPin(pin: String) {
        val salt = newSalt()
        val hash = hash(pin, salt)
        prefs.edit()
            .putString(KEY_SALT, salt)
            .putString(KEY_HASH, hash)
            .apply()
    }

    /** Firestore'dan gelen mevcut hash+salt'ı yerel olarak saklar (çocuk cihaz senkronu). */
    fun storeSyncedHash(saltHex: String, hashHex: String) {
        prefs.edit()
            .putString(KEY_SALT, saltHex)
            .putString(KEY_HASH, hashHex)
            .apply()
    }

    fun verify(pin: String): Boolean {
        val salt = prefs.getString(KEY_SALT, null) ?: return false
        val stored = prefs.getString(KEY_HASH, null) ?: return false
        return constantTimeEquals(hash(pin, salt), stored)
    }

    fun currentSalt(): String? = prefs.getString(KEY_SALT, null)
    fun currentHash(): String? = prefs.getString(KEY_HASH, null)

    fun clear() {
        prefs.edit().remove(KEY_HASH).remove(KEY_SALT).apply()
    }

    private fun newSalt(): String {
        val bytes = ByteArray(16)
        SecureRandom().nextBytes(bytes)
        return bytes.toHex()
    }

    private fun hash(pin: String, saltHex: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        md.update(saltHex.toByteArray(Charsets.UTF_8))
        val digest = md.digest(pin.toByteArray(Charsets.UTF_8))
        return digest.toHex()
    }

    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        var result = 0
        for (i in a.indices) result = result or (a[i].code xor b[i].code)
        return result == 0
    }

    private fun ByteArray.toHex(): String =
        joinToString("") { "%02x".format(it) }

    companion object {
        private const val KEY_HASH = "pin_hash"
        private const val KEY_SALT = "pin_salt"
    }
}
