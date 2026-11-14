# Actas de obra - app Android

## Conseguir el APK (sin instalar nada en tu ordenador)
1. Crea una cuenta gratuita en github.com y un repositorio nuevo (privado si quieres).
2. Sube TODO el contenido de esta carpeta (incluida la carpeta oculta .github).
3. Entra en la pestaña "Actions" > "Crear APK". Espera 5-10 minutos a que termine.
4. Abre la ejecución terminada y descarga "actas-de-obra-apk" (un zip con app-debug.apk).
5. Pasa el APK al móvil e instálalo (Android pedirá permitir instalar apps de origen desconocido).

## Alternativa con Android Studio
    npm install
    npx cap add android
    npx cap sync android
    npx cap open android      (Build > Build APK)
Añade en android/app/src/main/AndroidManifest.xml: <uses-permission android:name="android.permission.CAMERA" />

## Notas
- Los datos se guardan en el propio móvil. Genera el PDF/Word de cada acta antes de empezar la siguiente.
- PDF y Word se guardan y comparten con el menú de Android (Drive, WhatsApp, correo, Archivos).
- El APK "debug" sirve para uso propio. Para Google Play hay que firmar una versión release.

## Lectura de escritura a mano (Google ML Kit)
- El complemento está en `plugins/ink-recognizer` y se instala solo con `npm install`.
- La primera vez que conviertas a texto el móvil necesita internet para descargar el modelo de español (unos 20 MB). Después funciona sin conexión.
- Escribe una línea por renglón (hoja rayada) para mejores resultados. El botón «Texto» lee lo escrito; «Manuscrito» lo deja como imagen. Lo elegido es lo que sale en el PDF y el Word.
- Si la compilación en GitHub falla, abre la ejecución en Actions, copia el error y envíalo para corregirlo.
