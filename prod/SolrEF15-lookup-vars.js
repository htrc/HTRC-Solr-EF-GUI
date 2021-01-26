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


var solr_doc_id_url_field         = "handleUrl_s";
var solr_doc_rights_field         = "rightsAttributes_s";
var solr_doc_genre_field          = "genre_ss";
var solr_doc_language_field       = "language_s";
var solr_doc_bibformat_field      = "bibliographicFormat_s";
var solr_doc_pubplace_field       = "pubPlace_s";
var solr_doc_typeofresource_field = "typeOfResource_s";

var solr_doc_fl_args = [
    "id",
    "title_s",
    solr_doc_id_url_field,
    solr_doc_rights_field,
    solr_doc_genre_field,
    "names_ss",
    "pubDate_s",
    solr_doc_pubplace_field,
    solr_doc_language_field,
    solr_doc_typeofresource_field,
    "classification_lcc_ss",
    "concept_ss"
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

var lup_typeofresource_dict = {};

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

