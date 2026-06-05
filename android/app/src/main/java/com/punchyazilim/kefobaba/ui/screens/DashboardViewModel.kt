package com.punchyazilim.kefobaba.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.punchyazilim.kefobaba.data.AppEvent
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.MonitoredApp
import com.punchyazilim.kefobaba.data.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PairingCodeState(
    val code: String? = null,
    val generating: Boolean = false,
    val error: String? = null
)

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repo: FirebaseRepository,
    private val settings: SettingsRepository
) : ViewModel() {

    private val familyIdFlow = settings.familyIdFlow.filterNotNull()

    val events: StateFlow<List<AppEvent>> =
        familyIdFlow.flatMapLatest { repo.observeEvents(it) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val monitoredApps: StateFlow<List<MonitoredApp>> =
        familyIdFlow.flatMapLatest { repo.observeMonitoredApps(it) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _pairing = MutableStateFlow(PairingCodeState())
    val pairing: StateFlow<PairingCodeState> = _pairing.asStateFlow()

    // Olay listesi için paket adı filtresi (null ise hepsi).
    private val _appFilter = MutableStateFlow<String?>(null)
    val appFilter: StateFlow<String?> = _appFilter.asStateFlow()

    fun setAppFilter(packageName: String?) {
        _appFilter.value = packageName
    }

    fun generatePairingCode() {
        if (_pairing.value.generating) return
        _pairing.value = PairingCodeState(generating = true)
        viewModelScope.launch {
            try {
                val familyId = familyIdFlow.first()
                val code = repo.generatePairingCode(familyId)
                _pairing.value = PairingCodeState(code = code)
            } catch (e: Exception) {
                _pairing.value = PairingCodeState(error = e.message ?: "Kod üretilemedi")
            }
        }
    }

    fun removeMonitoredApp(packageName: String) {
        viewModelScope.launch {
            val familyId = settings.familyIdFlow.firstOrNull() ?: return@launch
            runCatching { repo.removeMonitoredApp(familyId, packageName) }
        }
    }

    fun toggleMonitoredApp(app: MonitoredApp) {
        viewModelScope.launch {
            val familyId = settings.familyIdFlow.firstOrNull() ?: return@launch
            runCatching { repo.setMonitoredApp(familyId, app.copy(enabled = !app.enabled)) }
        }
    }
}
