package com.punchyazilim.kefobaba.util

import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await

/** Geçerli FCM kayıt token'ını döndürür (hata olursa boş string). */
suspend fun currentFcmToken(): String =
    runCatching { FirebaseMessaging.getInstance().token.await() }.getOrDefault("")
