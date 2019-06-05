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
});