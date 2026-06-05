package com.punchyazilim.kefobaba.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.punchyazilim.kefobaba.data.AppEvent
import com.punchyazilim.kefobaba.data.MonitoredApp
import com.punchyazilim.kefobaba.ui.components.PunchCard
import com.punchyazilim.kefobaba.ui.components.PunchPrimaryButton
import com.punchyazilim.kefobaba.ui.theme.PunchAccent
import com.punchyazilim.kefobaba.ui.theme.PunchBackground
import com.punchyazilim.kefobaba.ui.theme.PunchBlack
import com.punchyazilim.kefobaba.ui.theme.PunchError
import com.punchyazilim.kefobaba.ui.theme.PunchSurface
import com.punchyazilim.kefobaba.ui.theme.PunchTextMuted
import com.punchyazilim.kefobaba.ui.theme.PunchTextSecondary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParentDashboardScreen(
    onAddApps: () -> Unit,
    onManagePin: () -> Unit,
    vm: DashboardViewModel = hiltViewModel()
) {
    var tab by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = PunchBackground,
        topBar = {
            TopAppBar(
                title = { Text("Kefo Baba Takipte") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = PunchBackground,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = PunchSurface) {
                val itemColors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PunchBlack,
                    selectedTextColor = PunchAccent,
                    indicatorColor = PunchAccent,
                    unselectedIconColor = PunchTextMuted,
                    unselectedTextColor = PunchTextMuted
                )
                NavigationBarItem(
                    selected = tab == 0, onClick = { tab = 0 },
                    icon = { Icon(Icons.Filled.History, null) },
                    label = { Text("Olaylar") }, colors = itemColors
                )
                NavigationBarItem(
                    selected = tab == 1, onClick = { tab = 1 },
                    icon = { Icon(Icons.Filled.Apps, null) },
                    label = { Text("Uygulamalar") }, colors = itemColors
                )
                NavigationBarItem(
                    selected = tab == 2, onClick = { tab = 2 },
                    icon = { Icon(Icons.Filled.QrCode2, null) },
                    label = { Text("Eşleştir") }, colors = itemColors
                )
                NavigationBarItem(
                    selected = tab == 3, onClick = { tab = 3 },
                    icon = { Icon(Icons.Filled.Lock, null) },
                    label = { Text("PIN") }, colors = itemColors
                )
            }
        }
    ) { padding ->
        Box(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            when (tab) {
                0 -> EventsTab(vm)
                1 -> AppsTab(vm, onAddApps)
                2 -> PairingTab(vm)
                else -> PinTab(onManagePin)
            }
        }
    }
}

@Composable
private fun EventsTab(vm: DashboardViewModel) {
    val events by vm.events.collectAsStateWithLifecycle()
    val filter by vm.appFilter.collectAsStateWithLifecycle()

    val filtered = remember(events, filter) {
        if (filter == null) events else events.filter { it.packageName == filter }
    }

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(8.dp))
        if (filter != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Filtre: ${filtered.firstOrNull()?.appName ?: filter}",
                    color = PunchAccent, style = MaterialTheme.typography.bodyMedium
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "Temizle",
                    color = PunchTextSecondary,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .clickable { vm.setAppFilter(null) }
                        .padding(8.dp)
                )
            }
        }
        if (filtered.isEmpty()) {
            EmptyState("Henüz olay yok. İzlenen uygulamalar açıldıkça burada görünecek.")
        } else {
            LazyColumn(Modifier.fillMaxSize()) {
                items(filtered) { e -> EventRow(e) }
            }
        }
    }
}

@Composable
private fun EventRow(event: AppEvent) {
    PunchCard(modifier = Modifier.padding(vertical = 6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    event.appName.ifBlank { event.packageName },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    "${event.childDeviceName} • açıldı",
                    style = MaterialTheme.typography.bodyMedium,
                    color = PunchTextSecondary
                )
            }
            Text(
                formatTime(event.timestamp),
                style = MaterialTheme.typography.bodyMedium,
                color = PunchAccent
            )
        }
    }
}

@Composable
private fun AppsTab(vm: DashboardViewModel, onAddApps: () -> Unit) {
    val apps by vm.monitoredApps.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(12.dp))
        PunchPrimaryButton(
            text = "İzlenecek Uygulama Ekle / Düzenle",
            onClick = onAddApps,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
        if (apps.isEmpty()) {
            EmptyState("Henüz izlenen uygulama seçilmedi.")
        } else {
            LazyColumn(Modifier.fillMaxSize()) {
                items(apps) { app -> MonitoredRow(app, vm) }
            }
        }
    }
}

@Composable
private fun MonitoredRow(app: MonitoredApp, vm: DashboardViewModel) {
    PunchCard(modifier = Modifier.padding(vertical = 6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    app.appName.ifBlank { app.packageName },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    app.packageName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = PunchTextMuted
                )
            }
            Switch(
                checked = app.enabled,
                onCheckedChange = { vm.toggleMonitoredApp(app) },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = PunchBlack,
                    checkedTrackColor = PunchAccent,
                    uncheckedThumbColor = PunchTextMuted
                )
            )
        }
    }
}

@Composable
private fun PairingTab(vm: DashboardViewModel) {
    val pairing by vm.pairing.collectAsStateWithLifecycle()
    Column(
        Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(24.dp))
        Text(
            "Çocuk Cihazını Eşleştir",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Aşağıdaki 6 haneli kodu çocuk cihazındaki uygulamaya girin. Kod 15 dakika geçerlidir.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(28.dp))
        PunchCard {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text(
                    pairing.code ?: "— — — — — —",
                    style = MaterialTheme.typography.headlineLarge.copy(letterSpacing = 8.sp),
                    color = PunchAccent
                )
            }
        }
        Spacer(Modifier.height(20.dp))
        PunchPrimaryButton(
            text = if (pairing.code == null) "Kod Üret" else "Yeni Kod Üret",
            onClick = { vm.generatePairingCode() },
            loading = pairing.generating,
            modifier = Modifier.fillMaxWidth()
        )
        pairing.error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = PunchError, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun PinTab(onManagePin: () -> Unit) {
    Column(
        Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(24.dp))
        Text(
            "Güvenlik PIN'i",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "PIN, çocuk cihazında kaldırma korumasını kapatmak için gereklidir. " +
                "Hash'lenerek güvenli şekilde saklanır.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(24.dp))
        PunchPrimaryButton(
            text = "PIN Belirle / Değiştir",
            onClick = onManagePin,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun EmptyState(text: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text,
            style = MaterialTheme.typography.bodyLarge,
            color = PunchTextMuted,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(32.dp)
        )
    }
}

private val timeFmt = SimpleDateFormat("dd.MM HH:mm", Locale("tr"))
private fun formatTime(ts: Long): String = timeFmt.format(Date(ts))
