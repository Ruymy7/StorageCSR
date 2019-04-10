<h1>API para enviar contenido a la Aplicación de Campus Sur Radio (Android)</h1>
<p> Es necesario incluir el apiToken en la cabecera de cada una de las llamadas a la API</p>
<p><b>token: "secret-token"</b></p>

<h2>Funciones GET</h2>
<h3>Obtener parrilla de radio</h3>
<p> <b>GET:</b> '/radioGrill' </p>
<p> Devuelve un JSON con la parrilla de radio del mes actual </p>
<br><br>

<h3>Obtener streaming de vídeo</h3>
<p> <b>GET:</b> '/videos/:video_name'&nbsp;&nbsp;&nbsp;
<b>*</b>En <b>"video_name"</b> debe ir el nombre del vídeo proporcionado en el JSON de radioGrill</p>
<p> Devuelve el vídeo en streaming, en formato MP4 </p>
<br><br>

<h3>Obtener streaming de audio</h3>
<p> <b>GET:</b> '/audios/:audio_name'&nbsp;&nbsp;&nbsp;
<b>*</b>En <b>"audio_name"</b> debe ir el nombre del audio proporcionado en el JSON de radioGrill</p>
<p> Devuelve el audio en streaming, en formato MP3 </p>
<br><br>

<h2>Funciones POST</h2>
<h3>Guardar JSON para parrilla</h3>
<p> <b>POST:</b> '/json' </p>
<p>Se debe enviar el "YYYY_MM.json" en el body con el nombre en formato YYYY_MM.json indicando el año y el mes para el que es válido</p>
<p>El valor del campo del formulario en el que va el fichero debe ser "file" (sin comillas). <br>El fichero json debe seguir el formato del fichero de ejemplo incluido en este repositorio: "2019_04(ejemplo).json"</p>
<br><br>
