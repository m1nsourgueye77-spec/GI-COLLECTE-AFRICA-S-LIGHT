/* =====================================================
   GI-COLLECTE V2
   AFRICA'S LIGHT
===================================================== */


/* =====================================================
   CONFIGURATION GI-COLLECTE V2 — AFRICA'S LIGHT
===================================================== */

const CONFIG = {
    apiUrl: "https://script.google.com/macros/s/AKfycbz6jysH1ltjpFTYHeGiU4f_9Jsf2K6KMCFGmaZh11jd7DOsmL9pKGoTV2qEMglb7O0ZIQ/exec",
    storageKey: "africasLightContributions",
    prefix: "ALA",
    year: new Date().getFullYear()
};


/* =====================================================
   CONNEXION GOOGLE SHEETS
===================================================== */

let contributionsCache = [];
let chargementContributions = false;

/**
 * Lit les contributions grâce à JSONP.
 * Cette méthode évite les problèmes CORS habituels
 * des requêtes GET vers Google Apps Script.
 */
function chargerContributionsDepuisGoogle() {
    return new Promise((resolve, reject) => {
        const callbackName =
            "giCodeCallback_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 100000);

        const script = document.createElement("script");

        const timeout = setTimeout(() => {
            nettoyer();

            reject(
                new Error(
                    "Délai dépassé lors de la lecture de Google Sheets."
                )
            );
        }, 15000);

        function nettoyer() {
            clearTimeout(timeout);
            delete window[callbackName];

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        window[callbackName] = function (resultat) {
            nettoyer();

            if (!resultat || resultat.success !== true) {
                reject(
                    new Error(
                        resultat?.message ||
                        "Impossible de lire les contributions."
                    )
                );

                return;
            }

            contributionsCache = Array.isArray(resultat.data)
                ? resultat.data
                : [];

            resolve(contributionsCache);
        };

        script.onerror = function () {
            nettoyer();

            reject(
                new Error(
                    "Impossible de contacter Google Apps Script."
                )
            );
        };

        const separator = CONFIG.apiUrl.includes("?")
            ? "&"
            : "?";

        script.src =
            CONFIG.apiUrl +
            separator +
            "action=lister&callback=" +
            encodeURIComponent(callbackName);

        document.head.appendChild(script);
    });
}

/**
 * Retourne le cache chargé depuis Google Sheets.
 * Les fonctions existantes peuvent ainsi continuer
 * à utiliser getContributions().
 */
function getContributions() {
    return contributionsCache.slice();
}

/**
 * Recalcule les statistiques et actualise l'historique
 * après le chargement des données centralisées.
 */
async function actualiserDepuisGoogle() {
    if (chargementContributions) {
        return;
    }

    chargementContributions = true;

    try {
        await chargerContributionsDepuisGoogle();

        actualiserDashboard();
        afficherHistorique();

    } catch (error) {
        console.error(error);

        alert(
            "Impossible de charger les contributions Google Sheets. " +
            "Vérifiez le déploiement de l'API et votre connexion."
        );

    } finally {
        chargementContributions = false;
    }
}

/**
 * Envoie une opération à Google Apps Script.
 *
 * Avec mode no-cors, le navigateur ne permet pas de lire
 * la réponse POST. La vérification s'effectue ensuite
 * en relisant les données depuis Google Sheets.
 */
async function envoyerVersGoogle(payload) {
    await fetch(CONFIG.apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify(payload)
    });

    // Laisser le temps au script Google de traiter la demande.
    await new Promise(resolve => setTimeout(resolve, 1000));

    return await chargerContributionsDepuisGoogle();
}

/**
 * Produit un identifiant provisoire à partir des IDs connus.
 * L'identifiant est vérifié par l'API lors de l'enregistrement.
 */
function genererNumero() {
    const prefixe = `${CONFIG.prefix}-${CONFIG.year}-`;

    const numeros = contributionsCache
        .map(item => {
            if (!item.id || !item.id.startsWith(prefixe)) {
                return 0;
            }

            return Number(item.id.slice(prefixe.length)) || 0;
        });

    const prochainNumero =
        Math.max(0, ...numeros) + 1;

    return prefixe +
        String(prochainNumero).padStart(6, "0");
}



/* =====================================================
   VARIABLES
===================================================== */

let contributionActuelle = null;


/* =====================================================
   INITIALISATION
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const date = document.getElementById("dateDon");

    if (date) {
        date.value = new Date().toISOString().split("T")[0];
    }

    const container =
        document.getElementById("historiqueContainer");

    if (container) {
        container.innerHTML =
            '<div class="card"><p>Chargement des contributions...</p></div>';
    }

    try {
        await chargerContributionsDepuisGoogle();

        actualiserDashboard();
        afficherHistorique();

    } catch (error) {
        console.error("Erreur de chargement :", error);

        if (container) {
            container.innerHTML = `
                <div class="card">
                    <p>Impossible de charger les contributions.</p>
                    <button onclick="actualiserDepuisGoogle()">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }
});

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

        modePaiement: "Wave",

        reference:
            document
                .getElementById("reference")
                .value
                .trim(),

        collecteur: collecteur,

        zone: zone

    };


    /* Enregistrement dans Google Sheets */

envoyerVersGoogle({
    action: "enregistrer",
    data: contribution
})
.then(contributions => {
    const enregistrementConfirme =
        contributions.some(item => item.id === contribution.id);

    if (!enregistrementConfirme) {
        throw new Error(
            "La contribution n'a pas été retrouvée dans Google Sheets."
        );
    }

    contributionActuelle =
        contributions.find(item => item.id === contribution.id);

    afficherConfirmation(contributionActuelle);

    actualiserDashboard();
    afficherHistorique();
})
.catch(error => {
    console.error("Erreur d'enregistrement :", error);

    alert(
        "L'enregistrement n'a pas pu être confirmé dans Google Sheets. " +
        "Vérifiez la feuille avant de réessayer afin d'éviter un doublon."
    );
});


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
                 <strong>Description du don :</strong>
                ${escapeHTML(data.description || "Non renseignée")}
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
        document.getElementById("historiqueContainer");

    const recherche =
        (
            document.getElementById("recherche")?.value || ""
        )
        .toLowerCase()
        .trim();

    let contributions = getContributions();

    contributions =
        contributions
            .slice()
            .reverse()
            .filter(item => {

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
                    item.typeDon,
                    item.description
                ]
                .join(" ")
                .toLowerCase();

                return texte.includes(recherche);

            });

    if (!contributions.length) {

        container.innerHTML = `
            <div class="card">
                <p>Aucune contribution trouvée.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        contributions
            .map(item => {

                const description =
                    item.description?.trim() || "";

                const montantAffiche =
                    Number(item.montant) > 0
                        ? formatMontant(Number(item.montant))
                        : "Don en nature";

                return `
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
                                ${escapeHTML(montantAffiche)}
                            </div>

                        </div>

                        <div class="history-details">

                            <span>
                                🎁
                                ${escapeHTML(item.typeDon || "-")}
                            </span>

                            <span>
                                ❤️
                                ${escapeHTML(item.destination || "-")}
                            </span>

                            ${
                                description
                                    ? `
                                        <div class="history-description">
                                            <strong>📦 Description du don :</strong>
                                            <span>${escapeHTML(description)}</span>
                                        </div>
                                    `
                                    : ""
                            }

                            <span>
                                📍
                                ${escapeHTML(item.zone || "-")}
                            </span>

                            <span>
                                👤
                                ${escapeHTML(item.collecteur || "-")}
                            </span>

                            <span>
                                📅
                                ${escapeHTML(item.dateDon || "-")}
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
                `;

            })
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
    "Description du don",
    data.description || "Non renseignée"
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


    if (data.typeDon === "Nature" || data.description) {
    ligne(
        "Description du don",
        data.description || "Non renseignée"
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

async function supprimerContribution(id) {
    const confirmation = confirm(
        `Supprimer définitivement la contribution ${id} ?`
    );

    if (!confirmation) {
        return;
    }

    try {
        await envoyerVersGoogle({
            action: "supprimer",
            id: id
        });

        const existeEncore =
            contributionsCache.some(item => item.id === id);

        if (existeEncore) {
            throw new Error(
                "La contribution existe encore dans Google Sheets."
            );
        }

        actualiserDashboard();
        afficherHistorique();

        alert("Contribution supprimée de Google Sheets.");

    } catch (error) {
        console.error(error);

        alert(
            "La suppression n'a pas pu être confirmée. " +
            "Vérifiez Google Sheets avant de recommencer."
        );
    }
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