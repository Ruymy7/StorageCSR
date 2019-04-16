<h1>API para enviar contenido a la Aplicación de Campus Sur Radio (Android)</h1>
<p> Es necesario incluir el apiToken en la cabecera de cada una de las llamadas POST a la API</p>
<p><b>token: "secret-token"</b><br><br>Puedes comprobar tu token con GET: '/api'</p> <br>

<hr>
<h2>Funciones GET</h2>
<h3>Obtener parrilla de radio</h3>
<p> <b>GET:</b> '/api/radioGrill' </p>
<p> Devuelve un JSON con la parrilla de radio del mes actual </p>
<br><br>

<h3>Obtener streaming de vídeo</h3>
<p> <b>GET:</b> '/api/videos/:video_name'&nbsp;&nbsp;&nbsp;
<b>*</b>En <b>"video_name"</b> debe ir el nombre del vídeo proporcionado en el JSON de radioGrill</p>
<p> Devuelve el vídeo en streaming, en formato MP4 </p>
<br><br>

<h3>Obtener streaming de audio</h3>
<p> <b>GET:</b> '/api/audios/:audio_name'&nbsp;&nbsp;&nbsp;
<b>*</b>En <b>"audio_name"</b> debe ir el nombre del audio proporcionado en el JSON de radioGrill</p>
<p> Devuelve el audio en streaming, en formato MP3 </p>
<br><br>

<h3>Obtener imagen</h3>
<p> <b>GET:</b> '/api/thumbnails/:image_name'&nbsp;&nbsp;&nbsp;
<b>*</b>En <b>"image_name"</b> debe ir el nombre de la imagen proporcionado en el JSON de radioGrill</p>
<br><br>

<hr>
<h2>Funciones POST</h2>
<h3>Guardar JSON para parrilla</h3>
<p> <b>POST:</b> '/api/json' </p>
<p>Se debe enviar el "YYYY_MM.json" en el body con el nombre en formato YYYY_MM.json indicando el año y el mes para el que es válido.<br>
El valor del campo del formulario en el que va el fichero debe ser "file" (sin comillas). <br>El fichero json debe seguir el formato del fichero de ejemplo incluido en este repositorio: "2019_04(ejemplo).json"</p>
<br>

<h3>Guardar vídeo</h3>
<p> <b>POST:</b> '/api/video' </p>
<p>Se debe enviar el vídeo que se desea guardar en el body. <br> El valor del campo del formulario en el que va el vídeo debe ser "video" (sin comillas).<br>
El nombre del vídeo debe ser el que se indique en el JSON de la parrilla.</p>
<br>

<h3>Guardar audio</h3>
<p> <b>POST:</b> '/api/audio' </p>
<p>Se debe enviar el vídeo que se desea guardar en el body. <br> El valor del campo del formulario en el que va el vídeo debe ser "audio" (sin comillas).<br>
El nombre del audio debe ser el que se indique en el JSON de la parrilla.</p>
<br>

<h3>Guardar imagen</h3>
<p> <b>POST:</b> '/api/thumbnails' </p>
<p>Se debe enviar la imagen que se desea guardar en el body. <br> El valor del campo del formulario en el que va la imagen debe ser "thumb" (sin comillas).<br>
El nombre de la imagen debe ser el que se indique en el JSON de la parrilla.</p>
<br>
