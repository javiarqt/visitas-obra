package com.actasobra.ink;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.common.MlKitException;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.common.model.RemoteModelManager;
import com.google.mlkit.vision.digitalink.DigitalInkRecognition;
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModel;
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModelIdentifier;
import com.google.mlkit.vision.digitalink.DigitalInkRecognizer;
import com.google.mlkit.vision.digitalink.DigitalInkRecognizerOptions;
import com.google.mlkit.vision.digitalink.Ink;
import com.google.mlkit.vision.digitalink.RecognitionContext;
import com.google.mlkit.vision.digitalink.WritingArea;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Lee escritura a mano a partir de trazos (x, y, tiempo).
 * Entrada: { lang, width, height, lines: [ [ [ [x,y,t], ... ], ...trazos ], ...líneas ] }
 * Salida:  { lines: ["texto línea 1", "texto línea 2", ...] }
 */
@CapacitorPlugin(name = "InkRecognizer")
public class InkRecognizerPlugin extends Plugin {

    @PluginMethod
    public void recognize(final PluginCall call) {
        final String lang = call.getString("lang", "es");
        final JSArray lines = call.getArray("lines");
        final Float wIn = call.getFloat("width", 1000f);
        final Float hIn = call.getFloat("height", 700f);
        final float w = wIn == null ? 1000f : wIn;
        final float h = hIn == null ? 700f : hIn;
        if (lines == null) {
            call.reject("No hay trazos que leer");
            return;
        }
        DigitalInkRecognitionModelIdentifier id;
        try {
            id = DigitalInkRecognitionModelIdentifier.fromLanguageTag(lang);
        } catch (MlKitException e) {
            call.reject("Idioma no disponible: " + lang);
            return;
        }
        if (id == null) {
            call.reject("Idioma no disponible: " + lang);
            return;
        }
        final DigitalInkRecognitionModel model = DigitalInkRecognitionModel.builder(id).build();
        final RemoteModelManager manager = RemoteModelManager.getInstance();
        manager
            .isModelDownloaded(model)
            .addOnSuccessListener(downloaded -> {
                if (downloaded) {
                    run(call, model, lines, w, h);
                } else {
                    manager
                        .download(model, new DownloadConditions.Builder().build())
                        .addOnSuccessListener(v -> run(call, model, lines, w, h))
                        .addOnFailureListener(e ->
                            call.reject("No se pudo descargar el modelo de lectura. Conéctate a internet la primera vez.")
                        );
                }
            })
            .addOnFailureListener(e -> call.reject("No se pudo comprobar el modelo de lectura"));
    }

    private void run(PluginCall call, DigitalInkRecognitionModel model, JSArray lines, float w, float h) {
        try {
            DigitalInkRecognizer recognizer = DigitalInkRecognition.getClient(DigitalInkRecognizerOptions.builder(model).build());
            RecognitionContext context = RecognitionContext.builder().setWritingArea(new WritingArea(w, h)).build();
            recognizeLine(call, recognizer, context, lines, 0, new JSArray());
        } catch (Exception e) {
            call.reject("Error al preparar la lectura: " + e.getMessage());
        }
    }

    private void recognizeLine(
        final PluginCall call,
        final DigitalInkRecognizer recognizer,
        final RecognitionContext context,
        final JSArray lines,
        final int index,
        final JSArray out
    ) {
        if (index >= lines.length()) {
            JSObject result = new JSObject();
            result.put("lines", out);
            call.resolve(result);
            return;
        }
        try {
            JSONArray strokes = lines.getJSONArray(index);
            Ink.Builder ink = Ink.builder();
            for (int s = 0; s < strokes.length(); s++) {
                JSONArray points = strokes.getJSONArray(s);
                Ink.Stroke.Builder stroke = Ink.Stroke.builder();
                for (int p = 0; p < points.length(); p++) {
                    JSONArray pt = points.getJSONArray(p);
                    stroke.addPoint(Ink.Point.create((float) pt.getDouble(0), (float) pt.getDouble(1), pt.getLong(2)));
                }
                ink.addStroke(stroke.build());
            }
            recognizer
                .recognize(ink.build(), context)
                .addOnSuccessListener(result -> {
                    String text = "";
                    if (!result.getCandidates().isEmpty()) {
                        text = result.getCandidates().get(0).getText();
                    }
                    out.put(text);
                    recognizeLine(call, recognizer, context, lines, index + 1, out);
                })
                .addOnFailureListener(e -> call.reject("No se pudo leer la escritura: " + e.getMessage()));
        } catch (JSONException e) {
            call.reject("Datos de trazos no válidos");
        }
    }
}
