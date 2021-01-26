
var lup_langs_with_pos = ["en", "fr", "de", "es", "ar", "zh-cn" ];

var lup_langs_without_pos = [
    "af", "bg", "bn", "cs", "da", "el", "et", "fa", "fi", "he",
    "hi", "hr", "hu", "id", "it", "ja", "kn", "ko", "lt", "lv",
    "mk", "ml", "mr", "ne", "nl", "no", "pa", "pl", "pt", "ro",
    "ru", "sk", "sl", "so", "sq", "sv", "sw", "ta", "te", "th",
    "tl", "tr", "uk", "ur", "vi", "zh-tw"
];

var lup_volume_metadata_fields = {
    "accessProfile_t": null,
    "bibliographicFormat_t": null,
    //"classification_ddc_t": null,
    //"classification_lcc_t": null,
    "dateCreated_i": null,              // used to be dateCreated_t
    "genre_ss": null,

    // !!!!!
    // **** the following should be stored as a URI => _s !!!!
    "htid_s": null,                     // used to be handleUrl_t

    //"hathitrustRecordNumber_t": null,  
    "mainEntityOfPage_ss": null,        // used to be htBibUrl but now quite different
    "publisherName_t": null,            // used to be imprint_t
    //"isbn_t": null,
    //"issn_t": null,
    //"issuance_t": null,
    "language_t": null,
    "lastRightsUpdateDate_i": null,     // used to be lastUpdateDate_t
    //"lccn_t": null,
    "contributorName_t": null,          // used to be names_t
    "oclc_t": null,
    "pubDate_i": null,                  // used to be pubDate_t
    "pubPlaceName_t": null,             // used to be pubPlace_t
    "accessRights_t": null,             // used to be rightsAttributes_t
    "schemaVersion_s": null,            // used to be schemaVersion_t
    "sourceInstitution_t": null,
    //"sourceInstitutionRecordNumber_t": null,
    "title_t": null,
    "typeOfResource_s": null           // used to be typeOfResource_t

    // !!!!
    // e.g. coo.123452532
    // Gone from EF2.0 metadata, but at Ingest code indexes it
    // at the volume-level as 'id' and volumeid_s at page-level
    // 'id' at the page level is of the form coo.123452532.page-000133
    //"volumeIdentifier_t": null
};

var lup_volume_metadata_dict = {
    "accessProfile_t": "The code that indicates full-text access level (open, deny, google, page).",
    "bibliographicFormat_t": "Bibliographic format of the work.",
    //"classification_ddc_t": "The Dewey Decimal Classification call number supplied by the originating library.",
    //"classification_lcc_t": "The Library of Congress Classification call number supplied by the originating library.",
    "dateCreated_i": "The date this metadata object was processed.",
    "genre_ss": "LOC MARC Genre Terms (URIs) of the volume.",
    "htid_s": "The persistent URL identifier for the given volume.",

    //"hathitrustRecordNumber_t": "The unique record number for the volume in the HathiTrust Digital Library.",
    "mainEntityOfPage_ss": "The HathiTrust Bibliographic API calls for the volume.",
    "publisherName_t": "The place of publication, publisher, and publication date of the given volume.",
    //"isbn_t": "The International Standard Book Number for a volume.",
    //"issn_t": "The International Standard Serial Number for a volume.",
    //"issuance_t": "The bibliographic level of a volume",
    "language_t": "The primary language of the volume.",
    "lastRightsUpdateDate_i": "The date this page was last updated.",
    //"lccn_t": "The Library of Congress Call Number for a volume.",
    "contributorName_t": "The personal and corporate names associated with a volume.",
    "oclc_t": "Control number(s) assigned to each bibliographic record by the Online Computer Library Center (OCLC).",
    "pubDate_i": "The publication year.",
    "pubPlaceName_t": "The publication location.",
    "accessRights_t": "The rights attributes for a volume.",
    "schemaVersion_s": "A version identifier for the format and structure of this metadata object.",
    "sourceInstitution_t": "The original institution who contributed the volume.",
    //"sourceInstitutionRecordNumber_t": "The unique record number for the volume from its original institution.",
    "title_t": "Title of the volume.",
    "typeOfResource_s": "The format type of a volume."
    //"volumeIdentifier_t": "A unique identifier for the current volume. This is the same identifier used in the HathiTrust and HathiTrust Research Center corpora."
};

// The following are the fields that get search if the user enters a query
// terms without any 'field:' part to the term
var lup_volume_metadata_fields_common = [
    "accessProfile_t", "genre_ss", "publisherName_t",
    "language_ss", "contributorName_t", "oclc_ss",
    "pubPlaceName_t", "accessRights_t", "title_t", "typeOfResource_s"
];


var facet_fields_display = {
    'genre_ss'             : 'Genre',
    'language_ss'          : 'Language',
    'accessRights_s'       : 'Copyright Status',
    'contributorName_ss'   : 'Author',
    'pubPlaceName_ss'      : 'Place of Publication',
    'bibliographicFormat_s': 'Original Format',
    'concept_ss'           : 'Concepts'
};

var solr_doc_id_url_field         = "htid_s";
var solr_doc_rights_field         = "accessRights_s";
var solr_doc_genre_field          = "genre_ss";
var solr_doc_language_field       = "language_ss";
var solr_doc_bibformat_field      = "bibliographicFormat_s";
var solr_doc_pubplace_field       = "pubPlaceName_ss";
var solr_doc_typeofresource_field = "typeOfResource_s";

var solr_doc_fl_args = [
    "id",
    "title_s",
    solr_doc_id_url_field,
    solr_doc_rights_field,
    solr_doc_genre_field,
    "contributorName_ss",
    "pubDate_i",
    solr_doc_pubplace_field,
    solr_doc_language_field,
    "typeOfResource_s",
    "concept_ss"
];

function title_and_authors_tooltip_details(doc_val,title)
{
    var title_tidied = title.replace(/\.\s*$/,""); // remove any trailing fullstop, in anticipation of "by ..." author(s)
    var title_and_authors = title_tidied;
    
    var details = [];
    details.push("Title: " + title_tidied);
    
    if (doc_val['contributorName_ss']) {
	var names = doc_val['contributorName_ss'].map(strtrim).join(", ");
	if (!names.match(/^\s*$/)) {
	    details.push("Author(s): " + names);
	    title_and_authors += " by " + names;
	}
    }
    if (doc_val[solr_doc_genre_field]) {
	//var genres = doc_val[solr_doc_genre_field].map(strtrim).join(", ");
	var genres_array = doc_val[solr_doc_genre_field].map(strtrim);
	//if (!genres.match(/^\s*$/)) {
	if (genres_array.length>0) {
	    for (var pos in genres_array) {
		genres_array[pos] = facet_filter.prettyPrintTerm(solr_doc_genre_field,genres_array[pos]);
	    }
	    var genres = genres_array.join(", ");
	    details.push("Genre(s): " + genres);
	}
    }
    
    if (doc_val['pubDate_i'] && !doc_val['pubDate_i'].toString().match(/^\s*$/)) {
	details.push("Publication date: " + doc_val['pubDate_i']);
    }
    if (doc_val[solr_doc_pubplace_field]) {
	var pubplaces = doc_val[solr_doc_pubplace_field].map(strtrim).join(", ");
	if (!pubplaces.match(/^\s*$/)) {
	    var pp_val = facet_filter.prettyPrintTerm(solr_doc_pubplace_field,pubplaces)
	    details.push("Place of Publication: " + pp_val);
	}
    }
    
    if (doc_val[solr_doc_language_field]) {
	var languages = doc_val[solr_doc_language_field].map(strtrim).join(", ");
	if (!languages.match(/^\s*$/)) {
	    var pp_val = facet_filter.prettyPrintTerm(solr_doc_language_field,languages)
	    details.push("Language(s): " + pp_val);
	}
    }
    
    if (doc_val[solr_doc_typeofresource_field]) {
	var typeofresource = doc_val[solr_doc_typeofresource_field];
	if (!typeofresource.match(/^\s*$/)) {
	    var pp_val = facet_filter.prettyPrintTerm(solr_doc_typeofresource_field,typeofresource)
	    details.push("Resource type: " + pp_val);
	}
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

// id.loc.gov/vocabulary/marcgt.json

var lup_genre_lod = 
[
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/rev",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "review"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/atl",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "atlas"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/lan",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "language instruction"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/mot",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "motion picture"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/dra",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "drama"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/com",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "computer program"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ins",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "instruction"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/his",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "history"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fon",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "font"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/sur",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "survey of literature"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/art",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "article"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/num",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "numeric data"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/lec",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "legal case and case notes"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/han",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "handbook"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/map",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "map"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/sta",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "statistics"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/pro",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "programmed text"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/loo",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "loose-leaf"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/doc",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "document (computer)"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/reh",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "rehearsal"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/pos",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "postcard"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fin",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "finding aid"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/mem",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "memoir"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/law",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "law report or digest"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/arr",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "art reproduction"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/rea",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "realia"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ess",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "essay"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/aro",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "art original"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/lea",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "legal article"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/enc",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "encyclopedia"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ser",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "series"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/stp",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "standard or specification"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/hum",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "humor, satire"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/vid",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "videorecording"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/wal",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "wall map"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/sli",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "slide"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/mic",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "microscope slide"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/off",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "offprint"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/dir",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "directory"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/rem",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "remote sensing image"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/man",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "manuscript"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/kit",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "kit"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/boo",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "book"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/gov",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "government publication"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/poe",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "poetry"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/rep",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "representational"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/web",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "web site"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/tra",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "transparency"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/inm",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "interactive multimedia"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/dio",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "diorama"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/iss",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "issue"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/puz",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "puzzle"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/pat",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "patent"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/leg",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "legislation"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/per",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "periodical"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ons",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "online system or service"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/nos",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "nonmusical sound"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fla",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "flash card"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/cal",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "calendar"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/yea",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "yearbook"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/scr",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "script"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/gra",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "graphic"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/new",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "newspaper"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/rpt",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "reporting"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/glo",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "globe"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/sho",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "short story"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fol",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "folktale"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/dic",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "dictionary"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fes",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "festschrift"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/gam",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "game"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ind",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "index"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/toy",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "toy"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/cpb",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "conference publication"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/jou",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "journal"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/spe",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "speech"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/bib",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "bibliography"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/the",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "thesis"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ter",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "technical report"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/dis",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "discography"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/dtb",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "database"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fil",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "filmography"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/int",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "interview"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/sou",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "sound"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/bio",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "biography"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/abs",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "abstract or summary"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/pic",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "picture"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/cha",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "chart"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fls",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "filmstrip"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/ted",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "technical drawing"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/mod",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "model"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/cat",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "catalog"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#MADSScheme",
            "http://www.w3.org/2004/02/skos/core#ConceptScheme"
        ],
        "http://www.loc.gov/mads/rdf/v1#hasMADSSchemeMember": [
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fla"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/puz"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/mot"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ons"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/enc"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fil"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/aut"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/lea"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/hum"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/sli"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/yea"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/stp"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/dra"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ess"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/mic"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/rev"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fls"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/pla"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/inm"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/jou"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/vid"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fol"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/glo"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/kit"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ser"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/num"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/art"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/han"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/spe"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fon"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/cat"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/atl"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/his"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/poe"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/reh"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/rep"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/loo"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ind"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/law"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/arr"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/new"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/mem"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/scr"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/iss"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fin"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/nov"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/web"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/rpt"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/toy"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/leg"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/aro"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/wal"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ted"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fic"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/map"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/rem"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/sho"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/bda"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ter"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/pat"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/dir"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/mod"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/com"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/dis"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/sou"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/nos"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/tre"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/cgn"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/cod"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/let"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/bib"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/gam"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/int"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/dtb"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/abs"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/gra"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/tra"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/dic"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/bio"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/ins"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/doc"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/sur"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/boo"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/the"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/lan"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/lec"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/per"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/dio"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/pic"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/cha"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/gov"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/man"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/fes"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/off"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/pos"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/sta"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/cal"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/pro"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/rea"
            },
            {
                "@id": "http://id.loc.gov/vocabulary/marcgt/cpb"
            }
        ],
        "http://www.w3.org/2000/01/rdf-schema#comment": [
            {
                "@value": "MARC Genre Terms List is derived from a controlled list of coded values representing MARC Genre Terms."
            }
        ],
        "http://www.w3.org/2000/01/rdf-schema#label": [
            {
                "@language": "en",
                "@value": "MARC Genre Terms List"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/cgn",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "comic or graphic novel"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/pla",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "playing cards"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/let",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "letter"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/cod",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "comedy"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/fic",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "fiction"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/bda",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "bibliographic data"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/aut",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "autobiography"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/nov",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "novel"
            }
        ]
    },
    {
        "@id": "http://id.loc.gov/vocabulary/marcgt/tre",
        "@type": [
            "http://www.loc.gov/mads/rdf/v1#Authority"
        ],
        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [
            {
                "@value": "treaty"
            }
        ]
    }
]


var lup_genre_dict = {};

for (var pos in lup_genre_lod) {
    var rec = lup_genre_lod[pos];    
    var id = rec['@id'];
    if (id !=  "http://id.loc.gov/vocabulary/marcgt") {
	var key = id;
	var val = rec['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
	lup_genre_dict[key] = val;
    }
}

// Manually formed from:
//   http://id.loc.gov/ontologies/bibframe.html#c_Work

var lup_typeofresource_dict = {
    "http://id.loc.gov/ontologies/bibframe/Audio":           "Audio",
    "http://id.loc.gov/ontologies/bibframe/Cartography":     "Cartography",
    "http://id.loc.gov/ontologies/bibframe/Dataset":         "Dataset",
    "http://id.loc.gov/ontologies/bibframe/MixedMaterial":   "Mixed Material",
    "http://id.loc.gov/ontologies/bibframe/MovingImage":     "Moving Image",
    "http://id.loc.gov/ontologies/bibframe/Multimedia":      "Multimedia",
    "http://id.loc.gov/ontologies/bibframe/NotatedMovement": "Notated Movement",
    "http://id.loc.gov/ontologies/bibframe/NotatedMusic":    "Notated Music",
    "http://id.loc.gov/ontologies/bibframe/Object":          "Object",
    "http://id.loc.gov/ontologies/bibframe/StillImage":      "Still Image",
    "http://id.loc.gov/ontologies/bibframe/Text":            "Text"
};



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


