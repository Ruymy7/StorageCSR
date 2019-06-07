$(function(){
    $("#uploadFile").submit(function(e){
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');

        var formData = new FormData();
        formData.append("file", form[0][0].files[0], form[0][0].files[0].name);

        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: url,
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function (data) {
                if(data.saved && !data.error){
                    alert("El archivo se ha guardado correctamente");
                } else {
                    alert("No se ha podido guardar correctamente el archivo");
                    console.log("Error: ", data.error);
                }
            },
            error: function (e) {
                alert("No se ha podido subir el archivo")
            }
        });
    });

    $(".logoutForm").submit(function (e) {
        e.preventDefault();
        $.post({
            url: '/login/logout',
            data: null,
            success: function () {
            }
        });
        window.location.href="/login"
    });

    let URLactual = (window.location.pathname).toString();
    if(URLactual === '/login'){
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
                        window.location.href="/index"
                    } else {
                        alert("Usuario o contraseña incorrectos")
                    }
                }
            });
        });
    }
});