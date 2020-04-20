var lup_langs_with_pos = ["en", "de", "pt", "da", "nl", "sv"];

var lup_langs_without_pos = [
    "af", "ar", "bg", "bn", "cs", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu",
    "id", "it", "ja", "kn", "ko", "lt", "lv", "mk", "ml", "mr", "ne", "no", "pa", "pl",
    "ro", "ru", "sk", "sl", "so", "sq", "sw", "ta", "te", "th", "tl", "tr",
    "uk", "ur", "vi", "zh-cn", "zh-tw"
];

var lup_volume_metadata_fields = {
    "accessProfile_t": null,
    "bibliographicFormat_t": null,
    "classification_ddc_t": null,
    "classification_lcc_t": null,
    "dateCreated_t": null,              
    "genre_t": null,
    "handleUrl_t": null,
    "hathitrustRecordNumber_t": null,  
    "htBibUrl_t": null,
    "imprint_t": null,
    "isbn_t": null,
    "issn_t": null,
    "issuance_t": null,
    "language_t": null,
    "lastUpdateDate_t": null,		      
    "lccn_t": null,
    "names_t": null,
    "oclc_t": null,
    "pubDate_t": null,
    "pubPlace_t": null,
    "rightsAttributes_t": null,
    "schemaVersion_t": null,
    "sourceInstitution_t": null,
    "sourceInstitutionRecordNumber_t": null,
    "title_t": null,
    "typeOfResource_t": null,
    "volumeIdentifier_t": null
};

var lup_volume_metadata_dict = {
    //"accessProfile_t": "A code that indicates full-text access level (open, deny, Google).",
    "accessProfile_t": "The code that indicates full-text access level (open, deny, google, page).",
    "bibliographicFormat_t": "Bibliographic format of the work.",
    "classification_ddc_t": "The Dewey Decimal Classification call number supplied by the originating library.",
    "classification_lcc_t": "The Library of Congress Classification call number supplied by the originating library.",
    "dateCreated_t": "The time this metadata object was processed.",
    "genre_t": "The genre of the volume.",
    "handleUrl_t": "The persistent identifier for the given volume.",
    "hathitrustRecordNumber_t": "The unique record number for the volume in the HathiTrust Digital Library.",
    "htBibUrl_t": "The HathiTrust Bibliographic API call for the volume.",
    "imprint_t": "The place of publication, publisher, and publication date of the given volume.",
    "isbn_t": "The International Standard Book Number for a volume.",
    "issn_t": "The International Standard Serial Number for a volume.",
    "issuance_t": "The bibliographic level of a volume",
    "language_t": "The primary language of the volume.",
    "lastUpdateDate_t": "The date this page was last updated.",
    "lccn_t": "The Library of Congress Call Number for a volume.",
    "names_t": "The personal and corporate names associated with a volume.",
    "oclc_t": "Control number(s) assigned to each bibliographic record by the Online Computer Library Center (OCLC).",
    "pubDate_t": "The publication year.",
    "pubPlace_t": "The publication location.",
    "rightsAttributes_t": "The rights attributes for a volume.",
    "schemaVersion_t": "A version identifier for the format and structure of this metadata object.",
    "sourceInstitution_t": "The original institution who contributed the volume.",
    "sourceInstitutionRecordNumber_t": "The unique record number for the volume from its original institution.",
    "title_t": "Title of the volume.",
    "typeOfResource_t": "The format type of a volume.",
    "volumeIdentifier_t": "A unique identifier for the current volume. This is the same identifier used in the HathiTrust and HathiTrust Research Center corpora."
};

// The following are the fields that get search if the user enters a query
// terms without any 'field:' part to the term
var lup_volume_metadata_fields_common = [
    "accessProfile_t", "genre_t", "imprint_t", "isbn_t", "issn_t",
    "issuance_t", "language_t", "lccn_t", "names_t", "oclc_t",
    "pubPlace_t", "pubDate_t", "rightsAttributes_t", "title_t", "typeOfResource_t"
];

var facet_fields_display = {
    'genre_ss'             : 'Genre',
    'language_s'           : 'Language',
    'rightsAttributes_s'   : 'Copyright Status',
    'names_ss'             : 'Author',
    'pubPlace_s'           : 'Place of Publication',
    'bibliographicFormat_s': 'Original Format',
    'classification_lcc_ss': 'Classification',
    'concept_ss'           : 'Concepts'
};


var solr_doc_id_url_field    = "handleUrl_s";
var solr_doc_rights_field    = "rightsAttributes_s";
var solr_doc_genre_field     = "genre_ss";
var solr_doc_language_field  = "language_s";
var solr_doc_bibformat_field = "bibliographicFormat_s";
var solr_doc_pubplace_field  = "pubPlace_s";

var solr_doc_fl_args = [
    "id", "title_s",
    solr_doc_id_url_field, solr_doc_rights_field,
    solr_doc_genre_field,
    "names_ss", "pubDate_s",
    solr_doc_pubplace_field, solr_doc_language_field,
    "typeOfResource_s", "classification_lcc_ss", "concept_ss"
];

function title_and_authors_tooltip_details(doc_val,title)
{
    var title_tidied = title.replace(/\.\s*$/,""); // remove any trailing fullstop, in anticipation of "by ..." author(s)
    var title_and_authors = title_tidied;
    
    var details = [];
    details.push("Title: " + title_tidied);

    
    if (doc_val['names_ss']) {
	var names = doc_val['names_ss'].map(strtrim).join(", ");
	if (!names.match(/^\s*$/)) {
	    details.push("Author(s): " + names);
	    title_and_authors += " by " + names;
	}
    }
    if (doc_val[solr_doc_genre_field]) {
	var genres = doc_val[solr_doc_genre_field].map(strtrim).join(", ");
	if (!genres.match(/^\s*$/)) {
	    details.push("Genre: " + genres.capitalize() );
	}
    }
    if (doc_val['pubDate_s'] && !doc_val['pubDate_s'].match(/^\s*$/)) {
	details.push("Publication date: " + doc_val['pubDate_s']);
    }
    if (doc_val['pubPlace_s'] && !doc_val['pubPlace_s'].match(/^\s*$/)) {
	var pp_val = facet_filter.prettyPrintTerm("pubPlace_s",doc_val['pubPlace_s'])
	details.push("Place of Publication: " + pp_val);
    }
    if (doc_val['language_s'] && !doc_val['language_s'].match(/^\s*$/)) {
	var pp_val = facet_filter.prettyPrintTerm("language_s",doc_val['language_s'])
	details.push("Language: " + pp_val);
    }
    if (doc_val['typeOfResource_s'] && !doc_val['typeOfResource_s'].match(/^\s*$/)) {
	details.push("Resource type: " + doc_val['typeOfResource_s'].capitalize() );
    }
    if (doc_val['concept_ss']) {
	var concepts = doc_val['concept_ss'].map(strtrim).join(", ");
	if (!concepts.match(/^\s*$/)) {
	    details.push("Concept(s): " + concepts.capitalize() );
	}
    }

    return { "title_and_authors": title_and_authors, "details": details };
}	




var lup_volume_metadata_help_dict = {}; // initialized in Solr-dom-ready.js

/*
volumeIdentifier: 
schemaVersion: 
dateCreated: 
title: 
pubDate: 
pubPlace: 
language: 
genre: 
issuance: 
typeOfResource: 
names: 
imprint: 

enumerationChronology: The page numbers of a specific section of a volume.

governmentDocument: Denotes if a volume is a government document.

rightsAttributes: 
hathitrustRecordNumber: 
htBibUrl: 
handleUrl: 
sourceInstitution: 
sourceInsitutionRecordNumber: 
oclc: 
isbn: 
issn: 
lccn: 
classification: 
bibliographicFormat: 
lastUpdatePage: 
*/

var lup_genre_dict = {};

var lup_format_dict = {
    'BK': 'Books',
    'SE': 'Serials',
    'CF': 'Computer Files',
    'MP': 'Maps',
    'MU': 'Music',
    'CR': 'Continuing Resources',
    'VM': 'Visual Materials',
    'MX': 'Mixed Materials'
};

var lup_place_dict = {
    'af': 'Afghanistan',
    'ie': 'Ireland',
    'ctu': 'Connecticut',
    '-tkr': 'Turkmen S.S.R.',
    'tk': 'Turkmenistan',
    'wyu': 'Wyoming',
    'sh': 'Spanish North Africa',
    '-gn': 'Gilbert and Ellice Islands',
    'aa': 'Albania',
    'mm': 'Malta',
    'nbu': 'Nebraska',
    '-cz': 'Canal Zone',
    'dcu': 'District of Columbia',
    'gr': 'Greece',
    'abc': 'Alberta',
    'ts': 'United Arab Emirates',
    'ci': 'Croatia',
    'tma': 'Tasmania',
    '-mvr': 'Moldavian S.S.R.',
    '-ln': 'Central and Southern Line Islands',
    'riu': 'Rhode Island',
    'xc': 'Maldives',
    'fr': 'France',
    'nw': 'Northern Mariana Islands',
    'pw': 'Palau',
    'np': 'Nepal',
    'ws': 'Samoa',
    'xoa': 'Northern Territory',
    'ko': 'Korea (South)',
    'ai': 'Armenia (Republic)',
    'snc': 'Saskatchewan',
    'ck': 'Colombia',
    'my': 'Malaysia',
    '-sk': 'Sikkim',
    'cm': 'Cameroon',
    'cq': 'Comoros',
    'ii': 'India',
    'mdu': 'Maryland',
    'lv': 'Latvia',
    'nju': 'New Jersey',
    'pk': 'Pakistan',
    'nik': 'Northern Ireland',
    'am': 'Anguilla',
    '-pt': 'Portuguese Timor',
    '-kgr': 'Kirghiz S.S.R.',
    'sr': 'Surinam',
    'scu': 'South Carolina',
    'cu': 'Cuba',
    '-err': 'Estonia',
    'xb': 'Cocos (Keeling) Islands',
    'xa': 'Christmas Island (Indian Ocean)',
    'xp': 'Spratly Island',
    '-ge': 'Germany (East)',
    'iau': 'Iowa',
    'nfc': 'Newfoundland and Labrador',
    'pp': 'Papua New Guinea',
    'gm': 'Gambia',
    'deu': 'Delaware',
    'xe': 'Marshall Islands',
    'vm': 'Vietnam',
    'qea': 'Queensland',
    'jo': 'Jordan',
    'tnu': 'Tennessee',
    'aj': 'Azerbaijan',
    'ksu': 'Kansas',
    '-vs': 'Vietnam, South',
    'tc': 'Turks and Caicos Islands',
    'sd': 'South Sudan',
    'tu': 'Turkey',
    'at': 'Australia',
    'ss': 'Western Sahara',
    'bt': 'Bhutan',
    'wj': 'West Bank of the Jordan River',
    '-ui': 'United Kingdom Misc. Islands',
    'cou': 'Colorado',
    'xxu': 'United States',
    'au': 'Austria',
    'cx': 'Central African Republic',
    'ce': 'Sri Lanka',
    'bcc': 'British Columbia',
    'fa': 'Faroe Islands',
    'ic': 'Iceland',
    'bs': 'Botswana',
    'rb': 'Serbia',
    'mp': 'Mongolia',
    'xl': 'Saint Pierre and Miquelon',
    'gw': 'Germany',
    'nhu': 'New Hampshire',
    'onc': 'Ontario',
    'nr': 'Nigeria',
    'vau': 'Virginia',
    'gt': 'Guatemala',
    'sl': 'Sierra Leone',
    'et': 'Ethiopia',
    '-kzr': 'Kazakh S.S.R.',
    'tl': 'Tokelau',
    'aku': 'Alaska',
    'aca': 'Australian Capital Territory',
    'stk': 'Scotland',
    'xf': 'Midway Islands',
    'xga': 'Coral Sea Islands Territory',
    '-sv': 'Swan Islands',
    'vtu': 'Vermont',
    'pn': 'Panama',
    'it': 'Italy',
    'jm': 'Jamaica',
    'mr': 'Morocco',
    '-gsr': 'Georgian S.S.R.',
    'oku': 'Oklahoma',
    'gv': 'Guinea',
    'wau': 'Washington (State)',
    'bo': 'Bolivia',
    '-nm': 'Northern Mariana Islands',
    'tz': 'Tanzania',
    'cl': 'Chile',
    'dq': 'Dominica',
    'bl': 'Brazil',
    'em': 'Timor-Leste',
    'ku': 'Kuwait',
    'lo': 'Lesotho',
    '-tt': 'Trust Territory of the Pacific Islands',
    'meu': 'Maine',
    'io': 'Indonesia',
    '-unr': 'Ukraine',
    'tv': 'Tuvalu',
    'go': 'Gabon',
    'gp': 'Guadeloupe',
    'ho': 'Honduras',
    'sc': 'Saint-Barthélemy',
    '-cp': 'Canton and Enderbury Islands',
    '-bwr': 'Byelorussian S.S.R.',
    'rw': 'Rwanda',
    'ot': 'Mayotte',
    '-ajr': 'Azerbaijan S.S.R.',
    '-xi': 'Saint Kitts-Nevis-Anguilla',
    'cr': 'Costa Rica',
    'su': 'Saudi Arabia',
    '-iu': 'Israel-Syria Demilitarized Zones',
    'sw': 'Sweden',
    'sp': 'Spain',
    'nu': 'Nauru',
    'inu': 'Indiana',
    'miu': 'Michigan',
    'un': 'Ukraine',
    'ta': 'Tajikistan',
    'an': 'Andorra',
    'vc': 'Vatican City',
    'mq': 'Martinique',
    '-ac': 'Ashmore and Cartier Islands',
    'mbc': 'Manitoba',
    'xx': 'No place',
    'gd': 'Grenada',
    'fp': 'French Polynesia',
    'mtu': 'Montana',
    'enk': 'England',
    '-ai': 'Anguilla',
    'alu': 'Alabama',
    'sdu': 'South Dakota',
    '-rur': 'Russian S.F.S.R.',
    'xd': 'Saint Kitts-Nevis',
    'pf': 'Paracel Islands',
    'ja': 'Japan',
    'mau': 'Massachusetts',
    'dk': 'Denmark',
    'xn': 'Macedonia',
    '-vn': 'Vietnam, North',
    'mu': 'Mauritania',
    'hiu': 'Hawaii',
    '-na': 'Netherlands Antilles',
    'azu': 'Arizona',
    '-ys': "Yemen (People's Democratic Republic)",
    'xh': 'Niue',
    'es': 'El Salvador',
    'nx': 'Norfolk Island',
    'gb': 'Kiribati',
    'ke': 'Kenya',
    'py': 'Paraguay',
    'xv': 'Slovenia',
    'lh': 'Liechtenstein',
    'aru': 'Arkansas',
    'txu': 'Texas',
    'bg': 'Bangladesh',
    'is': 'Israel',
    'ft': 'Djibouti',
    '-lir': 'Lithuania',
    'cj': 'Cayman Islands',
    'ohu': 'Ohio',
    'mk': 'Oman',
    'gau': 'Georgia',
    'za': 'Zambi',
    'uy': 'Uruguay',
    'sg': 'Senegal',
    '-uk': 'United Kingdom',
    'wf': 'Wallis and Futuna',
    'fs': 'Terres australes et antarctiques françaises',
    'kz': 'Kazakhstan',
    'ly': 'Libya',
    'utu': 'Utah',
    'cb': 'Cambodia',
    'ug': 'Uganda',
    '-cn': 'Canada',
    'vra': 'Victoria',
    '-hk': 'Hong Kong',
    'nsc': 'Nova Scotia',
    'bi': 'British Indian Ocean Territory',
    'cy': 'Cyprus',
    'sq': 'Swaziland',
    'nn': 'Vanuatu',
    'so': 'Somalia',
    'pg': 'Guinea-Bissau',
    '-yu': 'Serbia and Montenegro',
    'cd': 'Chad',
    'ml': 'Mali',
    'gs': 'Georgia (Republic)',
    'gz': 'Gaza Strip',
    'cw': 'Cook Islands',
    '-lvr': 'Latvia',
    'qa': 'Qatar',
    'ye': 'Yemen',
    'xs': 'South Georgia and the South Sandwich Islands',
    'nvu': 'Nevada',
    '-sb': 'Svalbard',
    'ag': 'Argentina',
    'st': 'Saint-Martin',
    'lb': 'Liberia',
    'mx': 'Mexico',
    'ae': 'Algeria',
    'uv': 'Burkina Faso',
    '-cs': 'Czechoslovakia',
    'ls': 'Laos',
    '-ry': 'Ryukyu Islands, Southern',
    'pl': 'Poland',
    're': 'Réunion',
    'lau': 'Louisiana',
    'ph': 'Philippines',
    'th': 'Thailand',
    'fm': 'Micronesia (Federated States)',
    'bp': 'Solomon Islands',
    'si': 'Singapore',
    'nq': 'Nicaragua',
    'kv': 'Kosovo',
    'kyu': 'Kentucky',
    'ba': 'Bahrain',
    'hm': 'Heard and McDonald Islands',
    'cg': 'Congo (Democratic Republic)',
    'mg': 'Madagascar',
    'iy': 'Iraq-Saudi Arabia Neutral Zone',
    'mv': 'Moldova',
    'uik': 'United Kingdom Misc. Islands',
    'po': 'Portugal',
    'gu': 'Guam',
    'xna': 'New South Wales',
    'ir': 'Iran',
    'wk': 'Wake Island',
    'dr': 'Dominican Republic',
    'eg': 'Equatorial Guinea',
    'iv': "Côte d'Ivoire",
    'bu': 'Bulgaria',
    'xxc': 'Canada',
    'ykc': 'Yukon Territory',
    'bm': 'Bermuda Islands',
    'pe': 'Peru',
    'nyu': 'New York (State)',
    'aq': 'Antigua and Barbuda',
    'dm': 'Benin',
    'bv': 'Bouvet Island',
    '-uzr': 'Uzbek S.S.R.',
    'sx': 'Namibia',
    '-air': 'Armenian S.S.R.',
    'kn': 'Korea (North)',
    'fj': 'Fiji',
    'bw': 'Belarus',
    '-wb': 'West Berlin',
    'fi': 'Finland',
    'mc': 'Monaco',
    'nz': 'New Zealand',
    'ch': 'China (Republic : 1949- )',
    'vi': 'Virgin Islands of the United States',
    'ti': 'Tunisia',
    'no': 'Norway',
    'ng': 'Niger',
    'sj': 'Sudan',
    'lu': 'Luxembourg',
    'gy': 'Guyana',
    'xr': 'Czech Republic',
    'fk': 'Falkland Islands',
    'mou': 'Missouri',
    'idu': 'Idaho',
    'ao': 'Angola',
    'nmu': 'New Mexico',
    'le': 'Lebanon',
    'ua': 'Egypt',
    'xo': 'Slovakia',
    'pr': 'Puerto Rico',
    'wlk': 'Wales',
    'li': 'Lithuania',
    'sf': 'Sao Tome and Principe',
    'xm': 'Saint Vincent and the Grenadines',
    'br': 'Burma',
    'be': 'Belgium',
    'oru': 'Oregon',
    'mw': 'Malawi',
    'flu': 'Florida',
    '-mh': 'Macao',
    'ht': 'Haiti',
    'pau': 'Pennsylvania',
    'cc': 'China',
    'xra': 'South Australia',
    'bn': 'Bosnia and Herzegovina',
    'xxk': 'United Kingdom',
    'ncu': 'North Carolina',
    'rm': 'Romania',
    'mf': 'Mauritius',
    'tr': 'Trinidad and Tobago',
    'up': 'United States Misc. Pacific Islands',
    '-jn': 'Jan Mayen',
    'uc': 'United States Misc. Caribbean Islands',
    'er': 'Estonia',
    'mj': 'Montserrat',
    'se': 'Seychelles',
    'nkc': 'New Brunswick',
    '-ur': 'Soviet Union',
    'fg': 'French Guiana',
    'bb': 'Barbados',
    'ec': 'Ecuador',
    'iq': 'Iraq',
    'ilu': 'Illinois',
    'as': 'American Samoa',
    'bx': 'Brunei',
    'bd': 'Burundi',
    'ea': 'Eritrea',
    'quc': 'Québec (Province)',
    'ji': 'Johnston Atoll',
    'nuc': 'Nunavut',
    'cau': 'California',
    'xj': 'Saint Helena',
    'ndu': 'North Dakota',
    'sz': 'Switzerland',
    'wea': 'Western Australia',
    'ca': 'Caribbean Netherlands',
    'nl': 'New Caledonia',
    'sa': 'South Africa',
    'sy': 'Syria',
    'ne': 'Netherlands',
    'mo': 'Montenegro',
    'ay': 'Antarctica',
    'mz': 'Mozambique',
    'gi': 'Gibraltar',
    'pic': 'Prince Edward Island',
    'sn': 'Sint Maarten',
    'kg': 'Kyrgyzstan',
    'rh': 'Zimbabwe',
    'hu': 'Hungary',
    'aw': 'Aruba',
    '-iw': 'Israel-Jordan Demilitarized Zones',
    'vp': 'Various places',
    '-us': 'United States',
    'uz': 'Uzbekistan',
    'bf': 'Bahamas',
    'co': 'Curaçao',
    'sm': 'San Marino',
    'msu': 'Mississippi',
    '-xxr': 'Soviet Union',
    'ntc': 'Northwest Territories',
    'tg': 'Togo',
    'xk': 'Saint Lucia',
    'vb': 'British Virgin Islands',
    've': 'Venezuela',
    'wvu': 'West Virginia',
    'mnu': 'Minnesota',
    'bh': 'Belize',
    'wiu': 'Wisconsin',
    'cv': 'Cabo Verde',
    'gl': 'Greenland',
    'to': 'Tonga',
    'cf': 'Congo (Brazzaville)',
    '-tar': 'Tajik S.S.R.',
    'gh': 'Ghana',
    'pc': 'Pitcairn Island',
    'ru': 'Russia (Federation)'
};

var pos_checkbox = [{
    pos: "VERB",
    label: "Verbs",
    tooltip: "Verbs (all tenses and modes)"
}, {
    pos: "NOUN",
    label: "Nouns",
    tooltip: "Nouns (common and proper)"
}, {
    pos: "ADJ",
    label: "Adjectives",
    tooltip: null
}, {
    pos: "ADV",
    label: "Adverbs",
    tooltip: null
}, {
    pos: "ADP",
    label: "Adpositions",
    tooltip: "Adpositions (prepositions and postpositions)"
}, {
    pos: "CONJ",
    label: "Conjunctions",
    tooltip: null
}, {
    pos: "DET",
    label: "Determiners",
    tooltip: null
}, {
    pos: "NUM",
    label: "Numbers",
    tooltip: "Cardinal numbers"
}, {
    pos: "PRT",
    label: "Particles",
    tooltip: "Particles or other function words"
}, {
    pos: "X",
    label: "Other",
    tooltip: "Other words, such as foreign words, typos, abbreviations"
}];


var worksets_public_lookup = {
    "http://worksets.hathitrust.org/graphs/189324114tst113": "Very Large Workset",
    "http://worksets.hathitrust.org/wsid/189324112":"fictmeta",
    "https://worksets.hathitrust.org/wsid/09fecd10-b543-11e8-bd63-2587a66f96d9":"Albion12",
    "https://worksets.hathitrust.org/wsid/3edff4d0-b5db-11e8-bd63-2587a66f96d9":"TDM",
    "https://worksets.hathitrust.org/wsid/16202420-b5ea-11e8-bd63-2587a66f96d9":"new_ws",
    "https://worksets.hathitrust.org/wsid/74ab8ef0-b5f7-11e8-bd63-2587a66f96d9":"Arthur_C._Doyle",
    "https://worksets.hathitrust.org/wsid/c39136a0-b5fc-11e8-bd63-2587a66f96d9":"HT_WS",
    "https://worksets.hathitrust.org/wsid/93605e00-b608-11e8-bd63-2587a66f96d9":"19th Century African American",
    "https://worksets.hathitrust.org/wsid/98373a70-b608-11e8-bd63-2587a66f96d9":"19th Century African American",
    "https://worksets.hathitrust.org/wsid/58779f80-b6c4-11e8-bd63-2587a66f96d9":"ArabObserverWorkset"
};

