package com.punchyazilim.kefobaba.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.InstalledApp
import com.punchyazilim.kefobaba.data.MonitoredApp
import com.punchyazilim.kefobaba.data.SettingsRepository
import com.punchyazilim.kefobaba.util.InstalledAppsLoader
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class AppPickerViewModel @Inject constructor(
    private val repo: FirebaseRepository,
    private val settings: SettingsRepository,
    private val loader: InstalledAppsLoader
) : ViewModel() {

    private val _allApps = MutableStateFlow<List<InstalledApp>>(emptyList())
    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private val _loading = MutableStateFlow(true)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val monitoredPackages: StateFlow<Set<String>> =
        settings.familyIdFlow.filterNotNull()
            .flatMapLatest { repo.observeMonitoredApps(it) }
            .map { list -> list.map { it.packageName }.toSet() }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    /** Görüntülenecek liste: arama + işaretli durum. */
    val apps: StateFlow<List<InstalledApp>> =
        combine(_allApps, _query, monitoredPackages) { all, q, monitored ->
            all
                .filter { q.isBlank() || it.appName.contains(q, ignoreCase = true) }
                .map { it.copy(isMonitored = it.packageName in monitored) }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            _allApps.value = loader.loadLaunchableApps()
            _loading.value = false
        }
    }

    fun setQuery(q: String) { _query.value = q }

    fun toggle(app: InstalledApp) {
        viewModelScope.launch {
            val familyId = settings.familyIdFlow.first() ?: return@launch
            if (app.isMonitored) {
                repo.removeMonitoredApp(familyId, app.packageName)
            } else {
                repo.setMonitoredApp(
                    familyId,
                    MonitoredApp(app.packageName, app.appName, enabled = true)
                )
            }
        }
    }
}
