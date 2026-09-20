/* =====================================================
   GI-COLLECTE V2
   AFRICA'S LIGHT
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

const CONFIG = {

    storageKey: "africasLightContributions",

    prefix: "ALA",

    year: new Date().getFullYear()

};


/* =====================================================
   VARIABLES
===================================================== */

let contributionActuelle = null;


/* =====================================================
   INITIALISATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const date = document.getElementById("dateDon");

        if (date) {

            date.value =
                new Date()
                .toISOString()
                .split("T")[0];

        }

        actualiserDashboard();

        afficherHistorique();

    }
);


/* =====================================================
   STOCKAGE
===================================================== */

function getContributions() {

    try {

        return JSON.parse(
            localStorage.getItem(
                CONFIG.storageKey
            )
        ) || [];

    } catch (error) {

        console.error(error);

        return [];

    }

}


function saveContributions(data) {

    localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(data)
    );

}


/* =====================================================
   GENERATION ID
===================================================== */

function genererNumero() {

    const contributions =
        getContributions();

    const numero =
        contributions.length + 1;

    return `${CONFIG.prefix}-${CONFIG.year}-${String(numero).padStart(6, "0")}`;

}


/* =====================================================
   RECUPERATION RADIO
===================================================== */

function valeurRadio(name) {

    const element =
        document.querySelector(
            `input[name="${name}"]:checked`
        );

    return element
        ? element.value
        : "";

}


/* =====================================================
   ENREGISTRER
===================================================== */

function enregistrerContribution(event) {

    event.preventDefault();


    const typeDon =
        valeurRadio("typeDon");

    const destination =
        valeurRadio("destination");


    const montant =
        Number(
            document.getElementById("montant").value
        ) || 0;


    const anonyme =
        document.getElementById("anonyme").checked;


    const nom =
        anonyme
            ? "Donateur anonyme"
            : document
                .getElementById("nom")
                .value
                .trim();


    if (!nom && !anonyme) {

        alert(
            "Veuillez renseigner le nom du donateur ou sélectionner l'option anonyme."
        );

        return;

    }


    const collecteur =
        document
            .getElementById("collecteur")
            .value
            .trim();


    const zone =
        document
            .getElementById("zone")
            .value
            .trim();


    if (!collecteur || !zone) {

        alert(
            "Veuillez renseigner le collecteur et la zone de collecte."
        );

        return;

    }


    const contribution = {

        id: genererNumero(),

        dateEnregistrement:
            new Date().toISOString(),

        dateDon:
            document
                .getElementById("dateDon")
                .value,

        nom: nom,

        anonyme: anonyme,

        typeDonateur:
            document
                .getElementById("typeDonateur")
                .value,

        telephone:
            document
                .getElementById("telephone")
                .value
                .trim(),

        adresse:
            document
                .getElementById("adresse")
                .value
                .trim(),

        commune:
            document
                .getElementById("commune")
                .value
                .trim(),

        identifiant:
            document
                .getElementById("identifiant")
                .value,

        numeroIdentifiant:
            document
                .getElementById("numeroIdentifiant")
                .value
                .trim(),

        typeDon: typeDon,

        description:
            document
                .getElementById("descriptionDon")
                .value
                .trim(),

        destination:
            destination,

        montant: montant,

        modePaiement:
            document
                .getElementById("modePaiement")
                .value,

        reference:
            document
                .getElementById("reference")
                .value
                .trim(),

        collecteur: collecteur,

        zone: zone

    };


    const contributions =
        getContributions();


    contributions.push(
        contribution
    );


    saveContributions(
        contributions
    );


    contributionActuelle =
        contribution;


    afficherConfirmation(
        contribution
    );


    actualiserDashboard();

    afficherHistorique();

}


/* =====================================================
   CONFIRMATION
===================================================== */

function afficherConfirmation(data) {

    document
        .getElementById("donationForm")
        .classList
        .add("hidden");


    const confirmation =
        document
            .getElementById("confirmation");


    confirmation.classList.remove(
        "hidden"
    );


    const montant =
        data.montant > 0
            ? formatMontant(data.montant)
            : "Don en nature";


    document
        .getElementById(
            "confirmationDetails"
        )
        .innerHTML = `

            <p>
                <strong>Numéro :</strong>
                ${escapeHTML(data.id)}
            </p>

            <p>
                <strong>Donateur :</strong>
                ${escapeHTML(data.nom)}
            </p>

            <p>
                <strong>Type de don :</strong>
                ${escapeHTML(data.typeDon)}
            </p>

            <p>
                <strong>Destination :</strong>
                ${escapeHTML(data.destination)}
            </p>

            <p>
                <strong>Contribution :</strong>
                ${escapeHTML(montant)}
            </p>

            <p>
                <strong>Collecteur :</strong>
                ${escapeHTML(data.collecteur)}
            </p>

            <p>
                <strong>Zone :</strong>
                ${escapeHTML(data.zone)}
            </p>

        `;

}


/* =====================================================
   NOUVELLE CONTRIBUTION
===================================================== */

function nouvelleContribution() {

    contributionActuelle = null;


    document
        .getElementById("donationForm")
        .reset();


    document
        .getElementById("confirmation")
        .classList
        .add("hidden");


    document
        .getElementById("donationForm")
        .classList
        .remove("hidden");


    document
        .getElementById("dateDon")
        .value =
        new Date()
            .toISOString()
            .split("T")[0];


    document
        .querySelector(
            'input[name="typeDon"][value="Argent"]'
        )
        .checked = true;


    document
        .querySelector(
            'input[name="destination"][value="Orphelins"]'
        )
        .checked = true;

}


/* =====================================================
   NAVIGATION
===================================================== */

function showSection(
    sectionId,
    button
) {

    document
        .querySelectorAll(".section")
        .forEach(
            section =>
                section.classList.remove(
                    "active"
                )
        );


    document
        .getElementById(sectionId)
        .classList.add("active");


    document
        .querySelectorAll(".nav-btn")
        .forEach(
            btn =>
                btn.classList.remove(
                    "active"
                )
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    if (sectionId === "dashboard") {

        actualiserDashboard();

    }


    if (sectionId === "historique") {

        afficherHistorique();

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

function actualiserDashboard() {

    const contributions =
        getContributions();


    const total =
        contributions.reduce(
            (sum, item) =>
                sum + Number(item.montant || 0),
            0
        );


    const orphelins =
        contributions.filter(
            item =>
                item.destination ===
                "Orphelins"
        ).length;


    const education =
        contributions.filter(
            item =>
                item.destination ===
                "Éducation"
        ).length;


    document
        .getElementById("statMontant")
        .textContent =
        formatMontant(total);


    document
        .getElementById("statDons")
        .textContent =
        contributions.length;


    document
        .getElementById("statOrphelins")
        .textContent =
        orphelins;


    document
        .getElementById("statEducation")
        .textContent =
        education;


    afficherStatsDestination(
        contributions
    );


    afficherStatsType(
        contributions
    );

}


/* =====================================================
   STATISTIQUES DESTINATION
===================================================== */

function afficherStatsDestination(
    contributions
) {

    const compteur = {};


    contributions.forEach(
        item => {

            const destination =
                item.destination ||
                "Non précisé";

            compteur[destination] =
                (compteur[destination] || 0)
                + 1;

        }
    );


    const container =
        document.getElementById(
            "destinationStats"
        );


    if (!Object.keys(compteur).length) {

        container.innerHTML =
            "<p>Aucune donnée.</p>";

        return;

    }


    container.innerHTML =
        Object.entries(compteur)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .map(
                ([nom, total]) => `

                    <div class="stat-line">

                        <span>
                            ${escapeHTML(nom)}
                        </span>

                        <strong>
                            ${total}
                        </strong>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   STATISTIQUES TYPE
===================================================== */

function afficherStatsType(
    contributions
) {

    const compteur = {};


    contributions.forEach(
        item => {

            const type =
                item.typeDon ||
                "Non précisé";

            compteur[type] =
                (compteur[type] || 0)
                + 1;

        }
    );


    const container =
        document.getElementById(
            "typeStats"
        );


    if (!Object.keys(compteur).length) {

        container.innerHTML =
            "<p>Aucune donnée.</p>";

        return;

    }


    container.innerHTML =
        Object.entries(compteur)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .map(
                ([nom, total]) => `

                    <div class="stat-line">

                        <span>
                            ${escapeHTML(nom)}
                        </span>

                        <strong>
                            ${total}
                        </strong>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   HISTORIQUE
===================================================== */

function afficherHistorique() {

    const container =
        document.getElementById(
            "historiqueContainer"
        );


    const recherche =
        (
            document
                .getElementById("recherche")
                ?.value || ""
        )
        .toLowerCase()
        .trim();


    let contributions =
        getContributions();


    contributions =
        contributions
            .slice()
            .reverse()
            .filter(
                item => {

                    if (!recherche) {

                        return true;

                    }


                    const texte = [

                        item.id,

                        item.nom,

                        item.telephone,

                        item.commune,

                        item.zone,

                        item.collecteur,

                        item.destination,

                        item.typeDon

                    ]
                    .join(" ")
                    .toLowerCase();


                    return texte.includes(
                        recherche
                    );

                }
            );


    if (!contributions.length) {

        container.innerHTML = `

            <div class="card">

                <p>
                    Aucune contribution trouvée.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        contributions
            .map(
                item => `

                    <article class="history-item">

                        <div class="history-header">

                            <div>

                                <div class="reference-id">
                                    ${escapeHTML(item.id)}
                                </div>

                                <strong>
                                    ${escapeHTML(item.nom)}
                                </strong>

                            </div>

                            <div class="amount">
                                ${
                                    item.montant > 0
                                    ? formatMontant(item.montant)
                                    : "Don en nature"
                                }
                            </div>

                        </div>


                        <div class="history-details">

                            <span>
                                🎁
                                ${escapeHTML(item.typeDon)}
                            </span>

                            <span>
                                ❤️
                                ${escapeHTML(item.destination)}
                            </span>

                            <span>
                                📍
                                ${escapeHTML(item.zone)}
                            </span>

                            <span>
                                👤
                                ${escapeHTML(item.collecteur)}
                            </span>

                            <span>
                                📅
                                ${escapeHTML(item.dateDon)}
                            </span>

                            <span>
                                💳
                                ${escapeHTML(item.modePaiement || "-")}
                            </span>

                        </div>


                        <div class="history-actions-row">

                            <button
                                class="btn-secondary"
                                onclick="telechargerPDFDepuisID('${item.id}')"
                            >
                                📄 Reçu
                            </button>

                            <button
                                class="btn-danger"
                                onclick="supprimerContribution('${item.id}')"
                            >
                                🗑️
                            </button>

                        </div>

                    </article>

                `
            )
            .join("");

}


/* =====================================================
   PDF
===================================================== */

function telechargerPDF() {

    if (!contributionActuelle) {

        alert(
            "Aucune contribution sélectionnée."
        );

        return;

    }


    genererPDF(
        contributionActuelle
    );

}


function telechargerPDFDepuisID(id) {

    const contribution =
        getContributions()
            .find(
                item =>
                    item.id === id
            );


    if (!contribution) {

        alert(
            "Contribution introuvable."
        );

        return;

    }


    contributionActuelle =
        contribution;


    genererPDF(
        contribution
    );

}


function genererPDF(data) {

    if (!window.jspdf) {

        alert(
            "Le module PDF n'est pas chargé. Vérifiez votre connexion Internet."
        );

        return;

    }


    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF();


    const blue =
        [0, 140, 153];

    const gold =
        [244, 197, 66];

    const green =
        [16, 185, 129];


    doc.setFillColor(
        ...blue
    );

    doc.rect(
        0,
        0,
        210,
        35,
        "F"
    );


    doc.setTextColor(
        ...gold
    );

    doc.setFontSize(
        22
    );

    doc.text(
        "Africa's Light",
        20,
        16
    );


    doc.setTextColor(
        255,
        255,
        255
    );

    doc.setFontSize(
        10
    );

    doc.text(
        "Hope for Every Child",
        20,
        25
    );


    doc.setFontSize(
        18
    );

    doc.setTextColor(
        ...blue
    );

    doc.text(
        "RECU DE DON",
        20,
        52
    );


    doc.setFontSize(
        10
    );

    let y = 68;


    const ligne = (
        label,
        valeur
    ) => {

        doc.setTextColor(
            80,
            80,
            80
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            label,
            20,
            y
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            String(valeur || "-"),
            75,
            y
        );


        y += 9;

    };


    ligne(
        "Numéro",
        data.id
    );

    ligne(
        "Date",
        data.dateDon
    );

    ligne(
        "Donateur",
        data.nom
    );

    ligne(
        "Téléphone",
        data.telephone
    );

    ligne(
        "Type de don",
        data.typeDon
    );

    ligne(
        "Destination",
        data.destination
    );

    ligne(
        "Montant",
        data.montant > 0
            ? formatMontant(data.montant)
            : "Don en nature"
    );

    ligne(
        "Mode de paiement",
        data.modePaiement
    );

    ligne(
        "Référence",
        data.reference
    );

    ligne(
        "Collecteur",
        data.collecteur
    );

    ligne(
        "Zone",
        data.zone
    );


    if (data.description) {

        ligne(
            "Description",
            data.description
        );

    }


    y += 10;


    doc.setFillColor(
        ...green
    );

    doc.roundedRect(
        20,
        y,
        170,
        18,
        3,
        3,
        "F"
    );


    doc.setTextColor(
        255,
        255,
        255
    );

    doc.setFontSize(
        11
    );

    doc.text(
        "Merci pour votre contribution.",
        105,
        y + 11,
        {
            align: "center"
        }
    );


    y += 35;


    doc.setTextColor(
        ...blue
    );

    doc.setFontSize(
        9
    );

    doc.text(
        "GI-COLLECTE V2",
        20,
        285
    );


    doc.setTextColor(
        100,
        100,
        100
    );

    doc.text(
        "Conçu par Gi.Code Formation",
        190,
        285,
        {
            align: "right"
        }
    );


    doc.save(
        `${data.id}.pdf`
    );

}


/* =====================================================
   EXPORT CSV
===================================================== */

function exporterCSV() {

    const data =
        getContributions();


    if (!data.length) {

        alert(
            "Aucune contribution à exporter."
        );

        return;

    }


    const colonnes = [

        "id",
        "dateDon",
        "nom",
        "anonyme",
        "typeDonateur",
        "telephone",
        "adresse",
        "commune",
        "identifiant",
        "numeroIdentifiant",
        "typeDon",
        "description",
        "destination",
        "montant",
        "modePaiement",
        "reference",
        "collecteur",
        "zone"

    ];


    const lignes = [

        colonnes.join(";"),

        ...data.map(
            item =>
                colonnes
                    .map(
                        col =>
                            csvEscape(
                                item[col]
                            )
                    )
                    .join(";")
        )

    ];


    const blob =
        new Blob(
            [
                "\uFEFF" +
                lignes.join("\n")
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        `africas-light-contributions-${CONFIG.year}.csv`;

    link.click();


    URL.revokeObjectURL(
        url
    );

}


/* =====================================================
   SUPPRESSION
===================================================== */

function supprimerContribution(id) {

    const confirmation =
        confirm(
            `Supprimer la contribution ${id} ?`
        );


    if (!confirmation) {

        return;

    }


    const data =
        getContributions()
            .filter(
                item =>
                    item.id !== id
            );


    saveContributions(
        data
    );


    actualiserDashboard();

    afficherHistorique();

}


function supprimerToutesLesDonnees() {

    const data =
        getContributions();


    if (!data.length) {

        alert(
            "Aucune donnée à supprimer."
        );

        return;

    }


    const confirmation =
        confirm(
            "ATTENTION : cette action supprimera toutes les contributions enregistrées sur cet appareil. Continuer ?"
        );


    if (!confirmation) {

        return;

    }


    localStorage.removeItem(
        CONFIG.storageKey
    );


    actualiserDashboard();

    afficherHistorique();

}


/* =====================================================
   UTILITAIRES
===================================================== */

function formatMontant(
    montant
) {

    return Number(
        montant || 0
    )
        .toLocaleString(
            "fr-FR"
        )
        + " FCFA";

}


function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );


    if (
        text.includes(";") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replaceAll(
            '"',
            '""'
        )}"`;

    }


    return text;

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}