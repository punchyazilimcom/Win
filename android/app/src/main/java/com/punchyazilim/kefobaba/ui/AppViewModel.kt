package com.punchyazilim.kefobaba.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.punchyazilim.kefobaba.data.DeviceRole
import com.punchyazilim.kefobaba.data.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

data class AppState(
    val ready: Boolean = false,
    val role: DeviceRole = DeviceRole.NONE,
    val familyId: String? = null
)

@HiltViewModel
class AppViewModel @Inject constructor(
    settings: SettingsRepository
) : ViewModel() {

    val state: StateFlow<AppState> =
        combine(settings.roleFlow, settings.familyIdFlow) { role, familyId ->
            AppState(ready = true, role = role, familyId = familyId)
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = AppState()
        )

    /** Başlangıç rotasını role göre belirler. */
    fun startDestination(state: AppState): String = when (state.role) {
        DeviceRole.NONE -> Routes.WELCOME
        DeviceRole.PARENT -> Routes.PARENT_DASHBOARD
        DeviceRole.CHILD -> Routes.CHILD_HOME
    }
}
