/* 
* StorageCSR (ETSISI-UPM)
* Autor: Padrón Castañeda, Ruymán
* Trabajo Fin de Grado
*/

$(function(){
    // Al hacer click en subir archivo
    $("#uploadFile").submit(function(e){
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');

        var formData = new FormData();
        formData.append("file", form[0][0].files[0], form[0][0].files[0].name);

        // Hacer el POST al back enviando el dichero excel que contiene la parrilla
        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: url,
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function (data) {
                if(data.saved && !data.error){ // Mostrar alerta de error
                    alert("El archivo se ha guardado correctamente");
                } else { // Mostrar alerta de guardado correctamente
                    alert("No se ha podido guardar correctamente el archivo");
                    console.log("Error: ", data.error);
                }
            },
            error: function (e) {
                alert("No se ha podido subir el archivo")
            }
        });
    });

    // Funcion que hace logout al pulsar cerrar sesión
    $(".logoutForm").submit(function (e) {
        e.preventDefault();
        $.post({
            url: '/login/logout',
            data: null,
            success: function () {
            }
        });
        window.location.href="/login" // Redirige al login
    });

    let URLactual = (window.location.pathname).toString();
    if(URLactual === '/login'){
        // Se envia el usuario y contraseña al back para comprobar que son correctos e iniciar sesión
        $(".loginForm").submit(function (e) {
            let data = {
                user: $(this)[0][0].value,
                password: $(this)[0][1].value
            };
            e.preventDefault();
            $.post({
                url: '/login',
                data: data,
                success: function (data) {
                    if(data.valid){
                        window.location.href="/admin"
                    } else {
                        alert("Usuario o contraseña incorrectos")
                    }
                }
            });
        });
    }
});