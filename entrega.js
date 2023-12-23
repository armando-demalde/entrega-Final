async function obtenerInformacionTasas() {
    const url = 'tasas.json';

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('La respuesta de la red no fue exitosa');
        }

        const data = await response.json();
        localStorage.setItem("tasas", JSON.stringify(data.tasas));
        return data.tasas;
    } catch (error) {
        throw new Error('Hubo un problema con la operación fetch:', error);
    }
}

function obtenerSolicitudesGuardadas() {
    let solicitudesGuardadas = localStorage.getItem("SolicitudesGuardadas");
    return solicitudesGuardadas ? JSON.parse(solicitudesGuardadas) : [];
}

function guardarSolicitudes(solicitudes) {
    localStorage.setItem("SolicitudesGuardadas", JSON.stringify(solicitudes));
}

function mostrarSolicitudes() {
}

window.onload = function () {
    let depositaEnBanco;

    let seleccionDeposito = document.getElementById("seleccionDeposito");
    let botonAgregarDeposito = document.getElementById("agregarDeposito");

    botonAgregarDeposito.addEventListener("click", function () {
        depositaEnBanco = seleccionDeposito.value === "Si";
        localStorage.setItem("DepositaEnBanco", depositaEnBanco);
    });

    let respuestaMonto = document.getElementById("ValorMonto");
    let respuestaIngresos = document.getElementById("ValorIngresos");
    let respuestaPlazo = document.getElementById("seleccionPlazo");

    let botonMonto = document.getElementById("agregarMonto");
    let botonIngresos = document.getElementById("agregarIngresos");
    let botonPlazo = document.getElementById("agregarPlazoLista");
    let botonAgregarSolicitud = document.getElementById("agregarSolicitud");
    let botonFetchTasas = document.getElementById("botonFetchTasas");
    let botonLimpiarDatos = document.getElementById("limpiarDatos");

    const solicitudes = obtenerSolicitudesGuardadas();

    botonMonto.addEventListener("click", function () {
        validarValorPositivo(respuestaMonto.value, "monto");
        localStorage.setItem("ValorMontoGuardado", respuestaMonto.value);
    });

    botonIngresos.addEventListener("click", function () {
        validarValorPositivo(respuestaIngresos.value, "ingresos");
        localStorage.setItem("ValorIngresosGuardado", respuestaIngresos.value);
    });

    botonPlazo.addEventListener("click", function () {
        let valorPlazo = parseInt(respuestaPlazo.value) || 0;
        document.getElementById("plazoLista").innerHTML = `${valorPlazo} meses`;
        localStorage.setItem("ValorPlazoGuardado", valorPlazo);
    });

    botonAgregarSolicitud.addEventListener("click", function () {
        let valorMonto = parseFloat(localStorage.getItem("ValorMontoGuardado")) || 0;
        let valorIngresos = parseFloat(localStorage.getItem("ValorIngresosGuardado")) || 0;
        let valorPlazo = parseInt(localStorage.getItem("ValorPlazoGuardado")) || 0;

        if (validarValores(valorMonto, valorIngresos, valorPlazo)) {
            let depositaEnBanco = localStorage.getItem("DepositaEnBanco") === "true";
            let cuotaMensual = calcularCuota(valorMonto, valorIngresos, valorPlazo, depositaEnBanco);

            if (cuotaMensual !== null) {
                mostrarSolicitudAgregada(cuotaMensual);

                let solicitud = {
                    monto: valorMonto,
                    ingresos: valorIngresos,
                    plazo: valorPlazo,
                };

                solicitudes.push(solicitud);
                guardarSolicitudes(solicitudes);
                mostrarSolicitudes();
            }
        } else {
            mostrarAdvertencia('Advertencia', 'Por favor, complete todos los campos antes de agregar la solicitud');
        }
    });

    botonFetchTasas.addEventListener("click", async function () {
        try {
            const tasas = await obtenerInformacionTasas();
            mostrarTasas(tasas);
        } catch (error) {
            console.error(error.message);
        }
    });

    botonLimpiarDatos.addEventListener("click", function () {
        localStorage.clear();
        location.reload(); 
    });

    function mostrarTasas(tasas) {
        const tasasContainer = document.getElementById("informacionTasas");
        tasasContainer.innerHTML = "<h3>Información de Tasas</h3>";

        tasas.forEach(tasa => {
            const tasaElement = document.createElement("div");
            tasaElement.innerHTML = `<p>Plazo: ${tasa.plazo} meses - Tasa de Depósito: ${tasa.tasa_depositos_30_dias}, Tasa de Préstamos Personales: ${tasa.tasa_prestamos_personales}</p>`;
            tasasContainer.appendChild(tasaElement);
        });
    }

    function validarValores(monto, ingresos, plazo) {
        return monto > 0 && ingresos > 0 && plazo > 0;
    }

    function validarValorPositivo(valor, campo) {
        if (valor <= 0 || isNaN(valor)) {
            mostrarAdvertencia('Advertencia', `Por favor, ingrese un valor válido para ${campo}`);
        }
    }

    function calcularCuota(monto, ingresos, plazo, depositaEnBanco) {
        const tasas = JSON.parse(localStorage.getItem("tasas"));

        if (!tasas) {
            mostrarAdvertencia('Advertencia', 'No se han cargado las tasas. Por favor, obtén la información de tasas antes de calcular la cuota.');
            return null;
        }

        const tasaSeleccionada = tasas.find(tasa => tasa.plazo === plazo);

        if (!tasaSeleccionada) {
            mostrarAdvertencia('Advertencia', 'No se encontró la tasa correspondiente. Verifica la información.');
            return null;
        }

        const tasaInteres = depositaEnBanco ? tasaSeleccionada.tasa_depositos_30_dias : tasaSeleccionada.tasa_prestamos_personales;
        const tasaEfectiva = 1 + tasaInteres;
        const numeroVecesCapitaliza = 12; 
        const plazoMeses = plazo;

        
        const tasaCompuesta = Math.pow(tasaEfectiva, 1 / numeroVecesCapitaliza) - 1;
        const cuotaMensual = (monto * tasaCompuesta) / (1 - Math.pow(1 + tasaCompuesta, -plazoMeses));

        return cuotaMensual;
    }

    function mostrarSolicitudAgregada(cuotaMensual) {
        if (cuotaMensual !== null) {
            mostrarAlerta('Solicitud Agregada', `La cuota mensual estimada es de: ${cuotaMensual.toFixed(2)} ARS`);
        } else {
            mostrarAdvertencia('Advertencia', 'No se pudo calcular la cuota. Por favor, verifica la información.');
        }
    }

    function mostrarAdvertencia(titulo, mensaje) {
        Swal.fire({
            icon: 'warning',
            title: titulo,
            text: mensaje,
        });
    }

    function mostrarAlerta(titulo, mensaje) {
        Swal.fire({
            icon: 'success',
            title: titulo,
            text: mensaje,
        });
    }
};
