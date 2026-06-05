package com.punchyazilim.kefobaba.ui.screens

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.punchyazilim.kefobaba.admin.KefoDeviceAdminReceiver
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.SettingsRepository
import com.punchyazilim.kefobaba.util.PinManager
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PinUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

@HiltViewModel
class PinViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val pinManager: PinManager,
    private val repo: FirebaseRepository,
    private val settings: SettingsRepository
) : ViewModel() {

    private val _ui = MutableStateFlow(PinUiState())
    val ui: StateFlow<PinUiState> = _ui.asStateFlow()

    fun isPinSet(): Boolean = pinManager.isPinSet()

    /** Ebeveyn: PIN belirler/değiştirir ve aileye senkronlar. */
    fun setPin(pin: String, confirm: String) {
        if (pin.length < 4) {
            _ui.value = PinUiState(error = "PIN en az 4 haneli olmalı.")
            return
        }
        if (pin != confirm) {
            _ui.value = PinUiState(error = "PIN'ler eşleşmiyor.")
            return
        }
        _ui.value = PinUiState(loading = true)
        viewModelScope.launch {
            try {
                pinManager.setPin(pin)
                val salt = pinManager.currentSalt()
                val hash = pinManager.currentHash()
                val familyId = settings.familyIdFlow.firstOrNull()
                if (familyId != null && salt != null && hash != null) {
                    repo.setFamilyPin(familyId, salt, hash)
                }
                _ui.value = PinUiState(success = true)
            } catch (e: Exception) {
                _ui.value = PinUiState(error = e.message ?: "PIN kaydedilemedi")
            }
        }
    }

    /**
     * Çocuk: koruma kaldırma için PIN doğrular. Önce Firestore'dan güncel PIN'i çeker
     * (ebeveyn değiştirmişse), doğrularsa Device Admin'i kapatır → uygulama kaldırılabilir.
     */
    fun verifyAndUnlock(pin: String) {
        _ui.value = PinUiState(loading = true)
        viewModelScope.launch {
            try {
                // Güncel PIN'i aileden senkronla.
                val familyId = settings.familyIdFlow.firstOrNull()
                if (familyId != null) {
                    repo.getFamilyPin(familyId)?.let { (salt, hash) ->
                        pinManager.storeSyncedHash(salt, hash)
                    }
                }
                if (!pinManager.isPinSet()) {
                    _ui.value = PinUiState(error = "Henüz PIN belirlenmemiş. Ebeveyn cihazından belirleyin.")
                    return@launch
                }
                if (pinManager.verify(pin)) {
                    disableDeviceAdmin()
                    _ui.value = PinUiState(success = true)
                } else {
                    _ui.value = PinUiState(error = "Hatalı PIN.")
                }
            } catch (e: Exception) {
                _ui.value = PinUiState(error = e.message ?: "Doğrulama başarısız")
            }
        }
    }

    private fun disableDeviceAdmin() {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val component = ComponentName(context, KefoDeviceAdminReceiver::class.java)
        if (dpm.isAdminActive(component)) {
            dpm.removeActiveAdmin(component)
        }
    }

    fun clear() { _ui.value = PinUiState() }
}
