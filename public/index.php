<!DOCTYPE html>
<html lang="en">

<head>
    <title>Solar calculator</title>
    <link rel="stylesheet" href="./styles/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.6.2/css/bulma.css">
    <link href="https://use.fontawesome.com/releases/v5.0.6/css/all.css" rel="stylesheet">
</head>

<body>

    <nav class="navbar is-warning" role="navigation" aria-label="main-navigation">
        <div class="navbar-brand">
            <a href="#" class="navbar-item title is-5">Solar Calculator</a>
        </div>
        <div class="navbar-end">
            <div class="navbar-item">
                <p class="control">
                    <a href="#" target="_blank" class="has-text-dark title is-5">
                        <span>About</span>
                    </a>
                </p>
            </div>
            <div class="navbar-item">
                <p class="control">
                    <a href="https://github.com/IonutMorariu/PV-Calculator" target="_blank" class="button is-dark">
                        <span class="icon">
                            <i class="fab fa-github-alt"></i>
                        </span>
                        <span>Github</span>
                    </a>
                </p>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="columns">
            <div class="column is-half">
                <h3 class="title is-4 has-text-centered">Datos del emplazamiento</h3>
                <div class="field">
                    <label class="label" for="address">Direccion</label>
                    <div class="control has-icons-left has-icons-right">
                        <input class="input" type="text" placeholder="Calle" id="address" required value="Calle Mayor">
                        <span class="icon is-small is-left">
                            <i class="fas fa-map-marker"></i>
                        </span>
                    </div>
                </div>
                <div class="field is-horizontal">
                    <div class="field-body">
                        <div class="field">
                            <label class="label" for="city">Municipio</label>
                            <div class="control has-icons-left has-icons-right">
                                <input class="input" type="text" placeholder="Municipio" id="city" required value="Guadalajara">
                                <span class="icon is-small is-left">
                                    <i class="fas fa-building"></i>
                                </span>
                            </div>
                        </div>
                        <div class="field">
                            <label class="label" for="postal">Código postal</label>
                            <div class="control has-icons-left has-icons-right">
                                <input class="input" type="text" placeholder="Código postal" id="postal" required value="19001">
                                <span class="icon is-small is-left">
                                    <i class="fas fa-hashtag"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <h3 class="title is-4">Datos de la casa</h3>
                <div class="field is-horizontal">
                    <div class="field-body">
                        <div class="field">
                            <label class="label" for="slope">Inclinación del tejado en grados </label>
                            <div class="control has-icons-left has-icons-right">
                                <input class="input" type="text" placeholder="Inclinación aproximada del tejado" id="slope" required value="20">
                                <span class="icon is-small is-left">
                                    <i class="fas fa-home"></i>
                                </span>
                            </div>
                        </div>
                        <div class="field">
                            <label class="label" for="area">Área del tejado en metros cuadrados</label>
                            <div class="control has-icons-left has-icons-right">
                                <input class="input" type="text" placeholder="Área del tejado" id="area" required value="23">
                                <span class="icon is-small is-left">
                                    <i class="fas fa-calculator"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="field is-horizontal">
                    <div class="field-body">
                        <div class="field">
                            <label for="" class="label">Orientación</label>
                            <p class="control has-icons-left">
                                <span class="select">
                                    <select id="orientation">
                                        <option disabled>Orientación</option>
                                        <option value="0">Norte (N)</option>
                                        <option value="45">Noreste(NE)</option>
                                        <option value="90">Este (E)</option>
                                        <option value="135">Sureste (SE)</option>
                                        <option selected value="180">Sur (S)</option>
                                        <option value="225">Suroste (SW)</option>
                                        <option value="270">Oeste (W)</option>
                                        <option value="315">Noroeste (NW)</option>
                                    </select>
                                </span>
                                <span class="icon is-small is-left">
                                    <i class="fas fa-compass"></i>
                                </span>
                            </p>
                        </div>
                        <div class="field">
                            <label for="" class="label">Presupuesto</label>
                            <p class="control has-icons-left">
                                <input type="text" class="input" placeholder="Presupuesto aproximado">
                                <span class="icon is-small is-left">
                                    <i class="fas fa-euro-sign"></i>
                                </span>
                            </p>
                        </div>
                    </div>

                </div>
                <div class="control has-text-centered">
                    <a class="button is-warning is-centered" id="button-get-coords">
                        <span class="icon">
                            <i class="fas fa-paper-plane"></i>
                        </span>
                        <span>Enviar</span>
                    </a>
                </div>
            </div>
            <div class="column is-half">
                <h2 class="title is-4 has-text-centered">Datos de tu instalacion</h2>
                <div class="contenedor-informacion box">
                    <table class="table tabla-informacion is-size-6">
                        <thead>
                            <th>Concepto</th>
                            <th>Valor</th>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Potencia de cada panel</td>
                                <td id="potencia-panel">300 W</td>
                            </tr>
                            <tr>
                                <td>Numero de paneles</td>
                                <td id="numero-panel">12</td>
                            </tr>
                            <tr>
                                <td>Potencia instalada</td>
                                <td id="potencia-instalada">3600 W</td>
                            </tr>
                            <tr>
                                <td>Generacion anual</td>
                                <td id="energia-anual">31.536 kWh</td>
                            </tr>
                            <tr>
                                <td>Potencia del inversor</td>
                                <td id="potencia-inversor">3800 W</td>
                            </tr>
                            <tr>
                                <td>Coste de la instalacion</td>
                                <td id="coste-instalacion">13.456 €</td>
                            </tr>
                            <tr>
                                <td>Ahorro mensual</td>
                                <td id="ahorro-mensual">123 €</td>
                            </tr>
                            <tr>
                                <td>Periodo de retorno</td>
                                <td id="tiempo-retorno">9 años</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="control has-text-centered">
                    <a class="button is-warning" id="button-print">
                        <span class="icon is-small">
                            <i class="fas fa-print"></i>
                        </span>
                        <span>Imprimir</span>
                    </a>
                </div>
            </div>
        </div>
</body>
<script src="./scripts/apiKeys.js"></script>
<script src="./scripts/dataAquisition.js"></script>


</html>