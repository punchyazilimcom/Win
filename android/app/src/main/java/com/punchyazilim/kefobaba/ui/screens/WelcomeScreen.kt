package com.punchyazilim.kefobaba.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.punchyazilim.kefobaba.ui.components.BrandLogo
import com.punchyazilim.kefobaba.ui.theme.PunchAccent
import com.punchyazilim.kefobaba.ui.theme.PunchBorder
import com.punchyazilim.kefobaba.ui.theme.PunchSurface
import com.punchyazilim.kefobaba.ui.theme.PunchTextSecondary

@Composable
fun WelcomeScreen(
    onSelectParent: () -> Unit,
    onSelectChild: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(40.dp))
        BrandLogo(logoSize = 150)
        Spacer(Modifier.height(28.dp))
        Text(
            text = "Ebeveyn Kontrolü & Uygulama İzleme",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Bu cihazın rolünü seçin",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(32.dp))

        RoleCard(
            icon = Icons.Filled.Shield,
            title = "Ebeveyn Cihazı",
            description = "Bildirim alın, izlenecek uygulamaları seçin, PIN yönetin.",
            onClick = onSelectParent
        )
        Spacer(Modifier.height(16.dp))
        RoleCard(
            icon = Icons.Filled.PhoneAndroid,
            title = "İzlenen Cihaz (Çocuk)",
            description = "Seçili uygulamalar açıldığında ebeveyne bildirim gönderir.",
            onClick = onSelectChild
        )

        Spacer(Modifier.height(24.dp))
        Text(
            text = "Bu uygulama gizlenmez. İzlenen cihazda her zaman görünür bir " +
                "\"İzleme aktif\" bildirimi gösterilir.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
    }
}

@Composable
private fun RoleCard(
    icon: ImageVector,
    title: String,
    description: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = PunchSurface),
        border = BorderStroke(1.dp, PunchBorder)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = PunchAccent,
                modifier = Modifier.size(36.dp)
            )
            Spacer(Modifier.width(16.dp))
            Column {
                Text(
                    title,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = PunchTextSecondary
                )
            }
        }
    }
}
