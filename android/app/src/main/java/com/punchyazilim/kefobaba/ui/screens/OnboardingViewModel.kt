package com.punchyazilim.kefobaba.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.punchyazilim.kefobaba.data.DeviceRole
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.PairingResult
import com.punchyazilim.kefobaba.data.SettingsRepository
import com.punchyazilim.kefobaba.util.currentFcmToken
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OnboardingUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val done: Boolean = false
)

/** Ebeveyn kurulumu ve çocuk eşleştirmesi için ortak ViewModel. */
@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val repo: FirebaseRepository,
    private val settings: SettingsRepository
) : ViewModel() {

    private val _ui = MutableStateFlow(OnboardingUiState())
    val ui: StateFlow<OnboardingUiState> = _ui.asStateFlow()

    /** Ebeveyn: yeni aile oluştur, bu cihazı ebeveyn olarak kaydet. */
    fun setupParent(deviceName: String) {
        if (_ui.value.loading) return
        _ui.value = OnboardingUiState(loading = true)
        viewModelScope.launch {
            try {
                val familyId = repo.createFamily()
                val deviceId = settings.getOrCreateDeviceId()
                val token = currentFcmToken()
                repo.registerDevice(familyId, deviceId, DeviceRole.PARENT, deviceName, token)
                settings.setFamilyId(familyId)
                settings.setDeviceName(deviceName)
                settings.setRole(DeviceRole.PARENT)
                _ui.value = OnboardingUiState(done = true)
            } catch (e: Exception) {
                _ui.value = OnboardingUiState(error = e.message ?: "Kurulum başarısız")
            }
        }
    }

    /** Çocuk: 6 haneli kodu doğrula, aileye bağlan, bu cihazı çocuk olarak kaydet. */
    fun pairChild(code: String, deviceName: String) {
        if (_ui.value.loading) return
        _ui.value = OnboardingUiState(loading = true)
        viewModelScope.launch {
            when (val result = repo.redeemPairingCode(code.trim())) {
                is PairingResult.Success -> {
                    try {
                        val familyId = result.familyId
                        val deviceId = settings.getOrCreateDeviceId()
                        val token = currentFcmToken()
                        repo.registerDevice(
                            familyId, deviceId, DeviceRole.CHILD, deviceName, token
                        )
                        // Ailedeki mevcut PIN'i çocuk cihaza senkronla (kaldırma koruması).
                        settings.setFamilyId(familyId)
                        settings.setDeviceName(deviceName)
                        settings.setRole(DeviceRole.CHILD)
                        _ui.value = OnboardingUiState(done = true)
                    } catch (e: Exception) {
                        _ui.value = OnboardingUiState(error = e.message ?: "Bağlanılamadı")
                    }
                }
                PairingResult.Expired ->
                    _ui.value = OnboardingUiState(error = "Kodun süresi dolmuş. Yeni kod isteyin.")
                PairingResult.NotFound ->
                    _ui.value = OnboardingUiState(error = "Kod bulunamadı. Tekrar kontrol edin.")
                is PairingResult.Error ->
                    _ui.value = OnboardingUiState(error = result.message)
            }
        }
    }

    fun clearError() {
        _ui.value = _ui.value.copy(error = null)
    }
}
