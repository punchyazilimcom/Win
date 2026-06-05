package com.punchyazilim.kefobaba.data

/** Cihazın bu ailedeki rolü. */
enum class DeviceRole {
    NONE,       // Henüz seçilmedi
    PARENT,     // Ebeveyn / yönetici cihaz
    CHILD       // İzlenen / çocuk cihaz
}

/** Firestore: families/{familyId}/events/{eventId} */
data class AppEvent(
    val id: String = "",
    val packageName: String = "",
    val appName: String = "",
    val timestamp: Long = 0L,
    val childDeviceId: String = "",
    val childDeviceName: String = ""
)

/** Firestore: families/{familyId}/monitoredApps/{packageName} */
data class MonitoredApp(
    val packageName: String = "",
    val appName: String = "",
    val enabled: Boolean = true
)

/** Firestore: families/{familyId}/devices/{deviceId} */
data class FamilyDevice(
    val deviceId: String = "",
    val role: String = "",
    val name: String = "",
    val fcmToken: String = "",
    val lastSeen: Long = 0L
)

/** Cihaza yüklü uygulama (seçici listesi). */
data class InstalledApp(
    val packageName: String,
    val appName: String,
    val isMonitored: Boolean = false
)

/** Eşleştirme sonucu. */
sealed interface PairingResult {
    data class Success(val familyId: String) : PairingResult
    data object Expired : PairingResult
    data object NotFound : PairingResult
    data class Error(val message: String) : PairingResult
}
