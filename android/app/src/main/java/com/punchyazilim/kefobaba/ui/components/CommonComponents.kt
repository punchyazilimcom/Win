package com.punchyazilim.kefobaba.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.punchyazilim.kefobaba.ui.theme.PunchAccent
import com.punchyazilim.kefobaba.ui.theme.PunchBlack
import com.punchyazilim.kefobaba.ui.theme.PunchBorder
import com.punchyazilim.kefobaba.ui.theme.PunchSurface
import com.punchyazilim.kefobaba.ui.theme.PunchTextPrimary

/** Birincil aksiyon — ince sarı çerçeve, koyu zemin (büyük sarı dolgu YOK). */
@Composable
fun PunchPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, PunchAccent),
        colors = ButtonDefaults.buttonColors(
            containerColor = PunchSurface,
            contentColor = PunchAccent,
            disabledContainerColor = PunchSurface,
            disabledContentColor = PunchBorder
        )
    ) {
        if (loading) {
            CircularProgressIndicator(
                color = PunchAccent,
                strokeWidth = 2.dp,
                modifier = Modifier.height(20.dp)
            )
        } else {
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

/** İkincil aksiyon — nötr çerçeve. */
@Composable
fun PunchSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, PunchBorder),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = PunchTextPrimary)
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

/** Hafif glassmorphism kart. */
@Composable
fun PunchCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = PunchSurface),
        border = BorderStroke(1.dp, PunchBorder)
    ) {
        Box(Modifier.padding(16.dp)) { content() }
    }
}
