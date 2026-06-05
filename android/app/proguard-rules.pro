# Firebase / Firestore model alanlarının korunması
-keepclassmembers class com.punchyazilim.kefobaba.data.model.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
