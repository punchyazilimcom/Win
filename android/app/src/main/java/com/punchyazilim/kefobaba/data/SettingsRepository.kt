package com.punchyazilim.kefobaba.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "kefo_settings")

/**
 * Cihaz yereli kalıcı ayarlar: rol, familyId, deviceId ve izlenen paket önbelleği.
 * İzlenen paketler ayrıca bellek içi [monitoredPackages] olarak tutulur; Erişilebilirlik
 * servisi her olayda hızlıca senkron okuyabilsin diye.
 */
@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object Keys {
        val ROLE = stringPreferencesKey("role")
        val FAMILY_ID = stringPreferencesKey("family_id")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val DEVICE_NAME = stringPreferencesKey("device_name")
        val MONITORED = stringSetPreferencesKey("monitored_packages")
    }

    val roleFlow: Flow<DeviceRole> = context.dataStore.data.map { prefs ->
        when (prefs[Keys.ROLE]) {
            DeviceRole.PARENT.name -> DeviceRole.PARENT
            DeviceRole.CHILD.name -> DeviceRole.CHILD
            else -> DeviceRole.NONE
        }
    }

    val familyIdFlow: Flow<String?> = context.dataStore.data.map { it[Keys.FAMILY_ID] }
    val deviceNameFlow: Flow<String?> = context.dataStore.data.map { it[Keys.DEVICE_NAME] }

    /** Erişilebilirlik servisinin senkron eriştiği bellek içi önbellek. */
    private val _monitoredPackages = MutableStateFlow<Set<String>>(emptySet())
    val monitoredPackages: StateFlow<Set<String>> = _monitoredPackages

    suspend fun setRole(role: DeviceRole) {
        context.dataStore.edit { it[Keys.ROLE] = role.name }
    }

    suspend fun setFamilyId(familyId: String) {
        context.dataStore.edit { it[Keys.FAMILY_ID] = familyId }
    }

    suspend fun setDeviceName(name: String) {
        context.dataStore.edit { it[Keys.DEVICE_NAME] = name }
    }

    /** Cihaz kimliği; yoksa üretip kalıcı saklar. */
    suspend fun getOrCreateDeviceId(): String {
        var id: String? = null
        context.dataStore.edit { prefs ->
            id = prefs[Keys.DEVICE_ID]
            if (id == null) {
                id = UUID.randomUUID().toString()
                prefs[Keys.DEVICE_ID] = id!!
            }
        }
        return id!!
    }

    val deviceIdFlow: Flow<String?> = context.dataStore.data.map { it[Keys.DEVICE_ID] }

    /** İzlenen paket setini hem DataStore'a hem bellek önbelleğine yazar. */
    suspend fun setMonitoredPackages(packages: Set<String>) {
        _monitoredPackages.value = packages
        context.dataStore.edit { it[Keys.MONITORED] = packages }
    }

    /** Açılışta bellek önbelleğini DataStore'dan doldurmak için. */
    suspend fun warmMonitoredCache() {
        val stored = stringSetOnce()
        _monitoredPackages.value = stored
    }

    private suspend fun stringSetOnce(): Set<String> {
        var result: Set<String> = emptySet()
        context.dataStore.edit { prefs ->
            result = prefs[Keys.MONITORED] ?: emptySet()
        }
        return result
    }

    suspend fun clearAll() {
        _monitoredPackages.value = emptySet()
        context.dataStore.edit { it.clear() }
    }
}
