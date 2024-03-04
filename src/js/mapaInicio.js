(function(){
    //Logical or (para evaluar campos vacíos)
    const lat =  9.9246495;
    const lng = -84.0757713;
    const mapa = L.map('mapa-inicio').setView([lat, lng ], 13);

    let markers = new L.FeatureGroup().addTo(mapa);

    let propiedades= [];

    //Filtros
    const filtros = {
        categoria: '',
        precio: ''
    }


    const categoriaSelected = document.querySelector('#categorias');
    const precioSelected = document.querySelector('#precios');


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);


    //Filtrado de Categorias y Precios
    categoriaSelected.addEventListener('change', e => {
        filtros.categoria = +e.target.value;
        filtrarPropiedades();

    })

    precioSelected.addEventListener('change', e => {
        filtros.precio = +e.target.value;
        filtrarPropiedades();
    })


    const obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades';
            //fetch permite consumir una API, viene integrado en el navegador
            const respuesta = await fetch(url);
            //obtención del json con las propiedades
            propiedades = await respuesta.json();
            
            mostrarPropiedades(propiedades);

        } catch (error) {
            console.log(error);
        }
    }

    const mostrarPropiedades = propiedades => {

        //Limpiar markers previos
        markers.clearLayers()


        propiedades.forEach(propiedad => {
            //Agregar pines
            const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
                autoPan: true
            })
            .addTo(mapa)
            .bindPopup(`
                <p class="text-indigo-600 font-bold">${propiedad.categoria.nombre}</p>
                <h1 class="text-xl font-extrabold uppercase my-3">${propiedad?.titulo}</h1>
                <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
                <a href="/propiedad/${propiedad.id}" class="bg-indigo-600 block text-center font-bold uppercase">Ver Propiedad </a>
                `)

            markers.addLayer(marker)
        })
    }


    const filtrarPropiedades = () => {
        const resultado = propiedades.filter(filtrarCategoria).filter(filtrarPrecio)
        mostrarPropiedades(resultado)
    }

    const filtrarCategoria = propiedad => filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad
    
    const filtrarPrecio = propiedad => filtros.precio ? propiedad.precioId === filtros.precio : propiedad


    obtenerPropiedades();
})()