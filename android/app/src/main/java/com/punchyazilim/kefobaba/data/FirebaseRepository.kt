package com.punchyazilim.kefobaba.data

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.random.Random

/**
 * Tüm Firestore erişimi buradan geçer.
 *
 * Yapı:
 *  - families/{familyId}: { pin_salt, pin_hash, createdAt }
 *  - families/{familyId}/devices/{deviceId}: { role, fcmToken, name, lastSeen }
 *  - families/{familyId}/monitoredApps/{packageName}: { appName, enabled }
 *  - families/{familyId}/events/{eventId}: { packageName, appName, timestamp, childDeviceId }
 *  - pairingCodes/{code}: { familyId, expiresAt }
 */
@Singleton
class FirebaseRepository @Inject constructor(
    private val db: FirebaseFirestore,
    private val auth: AuthManager
) {
    // ---------- Aile / Eşleştirme ----------

    /** Yeni aile oluşturur (ebeveyn ilk kurulumda). familyId döner. */
    suspend fun createFamily(): String {
        auth.ensureSignedIn()
        val doc = db.collection(FAMILIES).document()
        doc.set(
            mapOf("createdAt" to FieldValue.serverTimestamp())
        ).await()
        return doc.id
    }

    /** 6 haneli, 15 dk geçerli eşleştirme kodu üretir. */
    suspend fun generatePairingCode(familyId: String): String {
        auth.ensureSignedIn()
        val code = (Random.nextInt(0, 1_000_000)).toString().padStart(6, '0')
        val expiresAt = System.currentTimeMillis() + 15 * 60 * 1000
        db.collection(PAIRING).document(code).set(
            mapOf(
                "familyId" to familyId,
                "expiresAt" to expiresAt
            )
        ).await()
        return code
    }

    /** Çocuk cihaz kodu girer; aileye bağlanır. */
    suspend fun redeemPairingCode(code: String): PairingResult {
        return try {
            auth.ensureSignedIn()
            val snap = db.collection(PAIRING).document(code).get().await()
            if (!snap.exists()) return PairingResult.NotFound
            val familyId = snap.getString("familyId") ?: return PairingResult.NotFound
            val expiresAt = snap.getLong("expiresAt") ?: 0L
            if (System.currentTimeMillis() > expiresAt) {
                PairingResult.Expired
            } else {
                PairingResult.Success(familyId)
            }
        } catch (e: Exception) {
            PairingResult.Error(e.message ?: "Bilinmeyen hata")
        }
    }

    // ---------- Cihazlar ----------

    suspend fun registerDevice(
        familyId: String,
        deviceId: String,
        role: DeviceRole,
        name: String,
        fcmToken: String
    ) {
        auth.ensureSignedIn()
        db.collection(FAMILIES).document(familyId)
            .collection(DEVICES).document(deviceId)
            .set(
                mapOf(
                    "role" to role.name,
                    "name" to name,
                    "fcmToken" to fcmToken,
                    "lastSeen" to System.currentTimeMillis()
                )
            ).await()
    }

    suspend fun updateFcmToken(familyId: String, deviceId: String, token: String) {
        auth.ensureSignedIn()
        db.collection(FAMILIES).document(familyId)
            .collection(DEVICES).document(deviceId)
            .update("fcmToken", token, "lastSeen", System.currentTimeMillis())
            .await()
    }

    // ---------- İzlenen uygulamalar ----------

    suspend fun setMonitoredApp(familyId: String, app: MonitoredApp) {
        auth.ensureSignedIn()
        db.collection(FAMILIES).document(familyId)
            .collection(MONITORED).document(app.packageName)
            .set(
                mapOf(
                    "appName" to app.appName,
                    "enabled" to app.enabled
                )
            ).await()
    }

    suspend fun removeMonitoredApp(familyId: String, packageName: String) {
        auth.ensureSignedIn()
        db.collection(FAMILIES).document(familyId)
            .collection(MONITORED).document(packageName)
            .delete().await()
    }

    fun observeMonitoredApps(familyId: String): Flow<List<MonitoredApp>> = flow {
        auth.ensureSignedIn()
        emitAll(observeMonitoredAppsInternal(familyId))
    }

    private fun observeMonitoredAppsInternal(familyId: String): Flow<List<MonitoredApp>> = callbackFlow {
        val reg = db.collection(FAMILIES).document(familyId)
            .collection(MONITORED)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    close(err); return@addSnapshotListener
                }
                val list = snap?.documents?.map { d ->
                    MonitoredApp(
                        packageName = d.id,
                        appName = d.getString("appName") ?: d.id,
                        enabled = d.getBoolean("enabled") ?: true
                    )
                }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    // ---------- Olaylar ----------

    suspend fun writeEvent(familyId: String, event: AppEvent) {
        auth.ensureSignedIn()
        db.collection(FAMILIES).document(familyId)
            .collection(EVENTS).document()
            .set(
                mapOf(
                    "packageName" to event.packageName,
                    "appName" to event.appName,
                    "timestamp" to event.timestamp,
                    "childDeviceId" to event.childDeviceId,
                    "childDeviceName" to event.childDeviceName
                )
            ).await()
    }

    fun observeEvents(familyId: String, limit: Long = 200): Flow<List<AppEvent>> = flow {
        auth.ensureSignedIn()
        emitAll(observeEventsInternal(familyId, limit))
    }

    private fun observeEventsInternal(familyId: String, limit: Long): Flow<List<AppEvent>> = callbackFlow {
        val reg = db.collection(FAMILIES).document(familyId)
            .collection(EVENTS)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .limit(limit)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    close(err); return@addSnapshotListener
                }
                val list = snap?.documents?.map { d ->
                    AppEvent(
                        id = d.id,
                        packageName = d.getString("packageName") ?: "",
                        appName = d.getString("appName") ?: "",
                        timestamp = d.getLong("timestamp") ?: 0L,
                        childDeviceId = d.getString("childDeviceId") ?: "",
                        childDeviceName = d.getString("childDeviceName") ?: ""
                    )
                }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    // ---------- PIN ----------

    suspend fun setFamilyPin(familyId: String, saltHex: String, hashHex: String) {
        auth.ensureSignedIn()
        db.collection(FAMILIES).document(familyId)
            .set(
                mapOf("pin_salt" to saltHex, "pin_hash" to hashHex),
                com.google.firebase.firestore.SetOptions.merge()
            ).await()
    }

    /** (salt, hash) çiftini döndürür; yoksa null. */
    suspend fun getFamilyPin(familyId: String): Pair<String, String>? {
        auth.ensureSignedIn()
        val snap = db.collection(FAMILIES).document(familyId).get().await()
        val salt = snap.getString("pin_salt")
        val hash = snap.getString("pin_hash")
        return if (salt != null && hash != null) salt to hash else null
    }

    companion object {
        private const val FAMILIES = "families"
        private const val DEVICES = "devices"
        private const val MONITORED = "monitoredApps"
        private const val EVENTS = "events"
        private const val PAIRING = "pairingCodes"
    }
}
