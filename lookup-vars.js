

var langs_with_pos = ["en", "de", "pt", "da", "nl", "sv"];

var langs_without_pos = [
	"af", "ar", "bg", "bn", "cs", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu",
	"id", "it", "ja", "kn", "ko", "lt", "lv", "mk", "ml", "mr", "ne", "no", "pa", "pl",
	"ro", "ru", "sk", "sl", "so", "sq", "sv", "sw", "ta", "te", "th", "tl", "tr",
	"uk", "ur", "vi", "zh-cn", "zh-tw"
];


var rights_dic = {
    'pd':                  'Public domain',
    'ic':                  'In-copyright',
    'op':                  'Out-of-print (implies in-copyright)',
    'orph':                'Copyright-orphaned (implies in-copyright)',
    'und':                 'Undetermined copyright status',
    'ic-world':            'In-copyright and permitted as world viewable by the copyright holder',
    'nobody':              'Available to nobody; blocked for all users',
    'pdus':                'Public domain only when viewed in the US',
    'cc-by-3.0':           'Creative Commons Attribution license, 3.0 Unported',
    'cc-by-nd-3.0':        'Commons Attribution-NoDerivatives license, 3.0 Unported',
    'cc-by-nc-nd-3.0':     'Commons Attribution-NonCommercial-NoDerivatives license, 3.0 Unported',
    'cc-by-nc-3.0':        'Commons Attribution-NonCommercial license, 3.0 Unported',
    'cc-by-nc-sa-3.0':     'Commons Attribution-NonCommercial-ShareAlike license, 3.0 Unported',
    'cc-by-sa-3.0':        'Commons Attribution-ShareAlike license, 3.0 Unported',
    'orphcand':            'Orphan candidate - in 90-day holding period (implies in-copyright)',
    'cc-zero':             'Creative Commons Zero license (implies pd)',
    'und-world':           'Undetermined copyright status and permitted as world viewable by the depositor',
    'icus':                'In copyright in the US',
    'cc-by-4.0':           'Creative Commons Attribution 4.0 International license',
    'cc-by-nd-4.0':        'Commons Attribution-NoDerivatives 4.0 International license',
    'cc-by-nc-nd-4.0':     'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International license',
    'cc-by-nc-4.0':        'Commons Attribution-NonCommercial 4.0 International license',
    'cc-by-nc-sa-4.0':     'Commons Attribution-NonCommercial-ShareAlike 4.0 International license',
    'cc-by-sa-4.0':        'Commons Attribution-ShareAlike 4.0 International license',
    'pd-pvt':              'Public domain but access limited due to privacy concerns',
    'supp':                'Suppressed from view; see note for details'
};

var format_dic = {'BK':'Books', 'CF':'Computer Files', 'MP': 'Maps',
				'MU': 'Music', 'CR': 'Continuing Resources',
				'VM': 'Visual Materials', 'MX': 'Mixed Materials'};

var language_dic = {'-gal': 'Oromo', 'bak': 'Bashkir', 'art': 'Artificial (Other)', 'arw': 'Arawak', 'kam': 'Kamba', 'bin': 'Edo', 'bam': 'Bambara', 'lez': 'Lezgian', 'kir': 'Kyrgyz', 'twi': 'Twi', 'iii': 'Sichuan Yi', 'cau': 'Caucasian (Other)', 'tsn': 'Tswana', 'bel': 'Belarusian', 'ypk': 'Yupik languages', 'goh': 'German, Old High (ca. 750-1050)', '-sao': 'Samoan', 'grn': 'Guarani', 'gba': 'Gbaya', 'aze': 'Azerbaijani', 'sag': 'Sango (Ubangi Creole)', 'gil': 'Gilbertese', 'dua': 'Duala', 'mdf': 'Moksha', 'chm': 'Mari', 'ben': 'Bengali', 'sco': 'Scots', 'bur': 'Burmese', 'tyv': 'Tuvinian', 'nyn': 'Nyankole', 'glv': 'Manx', 'per': 'Persian', 'umb': 'Umbundu', 'paa': 'Papuan (Other)', 'lad': 'Ladino', 'ssw': 'Swazi', 'mnc': 'Manchu', 'chg': 'Chagatai', 'her': 'Herero', 'nia': 'Nias', 'alt': 'Altai', 'gla': 'Scottish Gaelic', 'nep': 'Nepali', 'ada': 'Adangme', 'myv': 'Erzya', 'sal': 'Salishan languages', 'cpf': 'Creoles and Pidgins, French-based (Other)', 'oss': 'Ossetic', 'ita': 'Italian', 'fao': 'Faroese', 'ewe': 'Ewe', 'awa': 'Awadhi', 'hrv': 'Croatian', 'fre': 'French', 'kro': 'Kru (Other)', 'lun': 'Lunda', 'eng': 'English', 'lin': 'Lingala', 'ger': 'German', 'syc': 'Syriac', 'lim': 'Limburgish', 'bla': 'Siksika', 'tir': 'Tigrinya', '-eth': 'Ethiopic', 'srp': 'Serbian', 'chi': 'Chinese', 'nzi': 'Nzima', 'tso': 'Tsonga', 'khi': 'Khoisan (Other)', 'sog': 'Sogdian', 'afa': 'Afroasiatic (Other)', '-esk': 'Eskimo languages', 'gor': 'Gorontalo', '-esp': 'Esperanto', 'bal': 'Baluchi', 'nqo': "N'Ko", 'bul': 'Bulgarian', 'dgr': 'Dogrib', 'frr': 'North Frisian', 'tlh': 'Klingon (Artificial language)', '-scc': 'Serbian', 'frs': 'East Frisian', 'raj': 'Rajasthani', 'tel': 'Telugu', 'lui': 'Luiseño', 'lus': 'Lushai', 'sna': 'Shona', 'wen': 'Sorbian (Other)', 'swa': 'Swahili', 'ach': 'Acoli', 'pol': 'Polish', 'orm': 'Oromo', 'kua': 'Kuanyama', 'kin': 'Kinyarwanda', 'afr': 'Afrikaans', 'bai': 'Bamileke languages', 'bos': 'Bosnian', 'nah': 'Nahuatl', 'sem': 'Semitic (Other)', 'phn': 'Phoenician', 'kut': 'Kootenai', 'cre': 'Cree', 'bej': 'Beja', 'gaa': 'Gã', 'sid': 'Sidamo', 'pau': 'Palauan', 'fon': 'Fon', 'kal': 'Kalâtdlisut', '-kus': 'Kusaie', '-mla': 'Malagasy', 'slo': 'Slovak', 'sit': 'Sino-Tibetan (Other)', 'mar': 'Marathi', 'suk': 'Sukuma', 'nic': 'Niger-Kordofanian (Other)', 'iku': 'Inuktitut', 'znd': 'Zande languages', 'tgk': 'Tajik', 'wak': 'Wakashan languages', 'bnt': 'Bantu (Other)', 'yid': 'Yiddish', 'lug': 'Ganda', 'mwr': 'Marwari', 'nau': 'Nauru', 'gez': 'Ethiopic', 'him': 'Western Pahari languages', 'ven': 'Venda', 'nob': 'Norwegian (Bokmål)', 'dum': 'Dutch, Middle (ca. 1050-1350)', 'cos': 'Corsican', 'kau': 'Kanuri', 'bik': 'Bikol', 'hai': 'Haida', 'mus': 'Creek', 'ave': 'Avestan', 'cel': 'Celtic (Other)', 'pal': 'Pahlavi', 'tli': 'Tlingit', 'crh': 'Crimean Tatar', 'mad': 'Madurese', 'uzb': 'Uzbek', 'efi': 'Efik', 'pro': 'Provençal (to 1500)', 'dyu': 'Dyula', 'bua': 'Buriat', 'tai': 'Tai (Other)', 'pon': 'Pohnpeian', 'guj': 'Gujarati', 'arn': 'Mapuche', 'sga': 'Irish, Old (to 1100)', 'amh': 'Amharic', 'zul': 'Zulu', 'inh': 'Ingush', 'elx': 'Elamite', '-cam': 'Khmer', 'lao': 'Lao', 'kos': 'Kosraean', 'bat': 'Baltic (Other)', '-gae': 'Scottish Gaelix', 'egy': 'Egyptian', 'sme': 'Northern Sami', 'del': 'Delaware', 'syr': 'Syriac, Modern', 'kbd': 'Kabardian', 'shn': 'Shan', 'kas': 'Kashmiri', 'nor': 'Norwegian', 'nym': 'Nyamwezi', 'gay': 'Gayo', 'tmh': 'Tamashek', 'hat': 'Haitian French Creole', 'ind': 'Indonesian', 'mal': 'Malayalam', 'non': 'Old Norse', 'kaw': 'Kawi', 'ice': 'Icelandic', 'bih': 'Bihari (Other)', 'ath': 'Athapascan (Other)', 'ltz': 'Luxembourgish', 'war': 'Waray', 'som': 'Somali', 'sux': 'Sumerian', 'was': 'Washoe', 'chu': 'Church Slavic', 'zen': 'Zenaga', 'tha': 'Thai', 'wel': 'Welsh', 'chv': 'Chuvash', 'car': 'Carib', 'ain': 'Ainu', 'nya': 'Nyanja', 'arp': 'Arapaho', 'mul': 'Multiple languages', 'nog': 'Nogai', 'tur': 'Turkish', 'jav': 'Javanese', 'kaz': 'Kazakh', 'abk': 'Abkhaz', 'mlt': 'Maltese', 'kac': 'Kachin', 'got': 'Gothic', 'den': 'Slavey', 'jbo': 'Lojban (Artificial language)', 'sla': 'Slavic (Other)', 'chk': 'Chuukese', '-int': 'Interlingua (International Auxiliary Language Association)', 'ukr': 'Ukrainian', 'heb': 'Hebrew', 'vie': 'Vietnamese', 'tiv': 'Tiv', 'hmn': 'Hmong', 'gon': 'Gondi', 'sun': 'Sundanese', 'sma': 'Southern Sami', 'krl': 'Karelian', 'gem': 'Germanic (Other)', 'kok': 'Konkani', 'lub': 'Luba-Katanga', 'sah': 'Yakut', 'fur': 'Friulian', 'frm': 'French, Middle (ca. 1300-1600)', 'tam': 'Tamil', '-iri': 'Irish', 'dan': 'Danish', 'ira': 'Iranian (Other)', 'krc': 'Karachay-Balkar', 'hmo': 'Hiri Motu', 'lav': 'Latvian', 'xal': 'Oirat', '-max': 'Manx', 'scn': 'Sicilian Italian', 'dsb': 'Lower Sorbian', 'srn': 'Sranan', 'peo': 'Old Persian (ca. 600-400 B.C.)', 'nbl': 'Ndebele (South Africa)', 'srr': 'Serer', 'ang': 'English, Old (ca. 450-1100)', 'ewo': 'Ewondo', 'fiu': 'Finno-Ugrian (Other)', 'snk': 'Soninke', 'aus': 'Australian languages', 'haw': 'Hawaiian', 'hup': 'Hupa', 'mak': 'Makasar', 'bho': 'Bhojpuri', 'mag': 'Magahi', 'dar': 'Dargwa', 'tvl': 'Tuvaluan', 'fat': 'Fanti', 'kur': 'Kurdish', 'tah': 'Tahitian', 'nav': 'Navajo', 'zxx': 'No linguistic content', 'vot': 'Votic', 'cpp': 'Creoles and Pidgins, Portuguese-based (Other)', 'man': 'Mandingo', 'cus': 'Cushitic (Other)', 'fan': 'Fang', 'udm': 'Udmurt', 'mic': 'Micmac', 'cai': 'Central American Indian (Other)', 'btk': 'Batak', 'nub': 'Nubian languages', 'zza': 'Zaz', 'iba': 'Iban', 'fry': 'Frisian', 'ceb': 'Cebuano', 'kum': 'Kumyk', 'min': 'Minangkabau', 'kom': 'Komi', 'rus': 'Russian', 'wol': 'Wolof', '-ajm': 'Aljamía', 'tum': 'Tumbuka', 'xho': 'Xhosa', 'bre': 'Breton', 'und': 'Undetermined', 'pli': 'Pali', 'rom': 'Romani', 'mis': 'Miscellaneous languages', 'kaa': 'Kara-Kalpak', 'baq': 'Basque', 'byn': 'Bilin', 'nai': 'North American Indian (Other)', 'eka': 'Ekajuk', 'sel': 'Selkup', 'asm': 'Assamese', 'lol': 'Mongo-Nkundu', 'cad': 'Caddo', 'chr': 'Cherokee', 'tgl': 'Tagalog', '-lan': 'Occitan (post 1500)', 'men': 'Mende', 'nyo': 'Nyoro', 'tup': 'Tupi languages', 'doi': 'Dogri', 'din': 'Dinka', 'pag': 'Pangasinan', 'bis': 'Bislama', 'kon': 'Kongo', 'aym': 'Aymara', 'hit': 'Hittite', 'yap': 'Yapese', 'bem': 'Bemba', 'run': 'Rundi', 'ipk': 'Inupiaq', 'lat': 'Latin', 'tet': 'Tetum', 'sas': 'Sasak', '-sso': 'Sotho', 'mao': 'Maori', 'tut': 'Altaic (Other)', '-swz': 'Swazi', 'mdr': 'Mandar', 'ara': 'Arabic', 'fij': 'Fijian', 'swe': 'Swedish', 'ilo': 'Iloko', 'rap': 'Rapanui', 'kru': 'Kurukh', 'aar': 'Afar', 'snd': 'Sindhi', 'afh': 'Afrihili (Artificial language)', 'inc': 'Indic (Other)', 'fil': 'Filipino', 'mlg': 'Malagasy', 'glg': 'Galician', 'smn': 'Inari Sami', 'rum': 'Romanian', '-scr': 'Croatian', 'lit': 'Lithuanian', 'nde': 'Ndebele (Zimbabwe)', 'zun': 'Zuni', 'mah': 'Marshallese', 'anp': 'Angika', 'tuk': 'Turkmen', 'kha': 'Khasi', 'tig': 'Tigré', 'chp': 'Chipewyan', 'tib': 'Tibetan', 'ile': 'Interlingue', 'luo': 'Luo (Kenya and Tanzania)', 'dra': 'Dravidian (Other)', 'ota': 'Turkish, Ottoman', 'gle': 'Irish', 'nap': 'Neapolitan Italian', 'tem': 'Temne', 'sai': 'South American Indian (Other)', 'cpe': 'Creoles and Pidgins, English-based (Other)', 'yao': 'Yao (Africa)', 'ava': 'Avaric', 'mni': 'Manipuri', 'iro': 'Iroquoian (Other)', 'new': 'Newari', 'oci': 'Occitan (post-1500)', 'mga': 'Irish, Middle (ca. 1100-1550)', 'sam': 'Samaritan Aramaic', '-tru': 'Truk', 'rup': 'Aromanian', 'jpr': 'Judeo-Persian', 'wal': 'Wolayta', 'akk': 'Akkadian', 'hil': 'Hiligaynon', 'grb': 'Grebo', 'cop': 'Coptic', 'sin': 'Sinhalese', 'hau': 'Hausa', 'zha': 'Zhuang', 'hun': 'Hungarian', 'ibo': 'Igbo', '-snh': 'Sinhalese', 'uga': 'Ugaritic', '-sho': 'Shona', 'gre': 'Greek, Modern (1453-)', 'pan': 'Panjabi', 'lua': 'Luba-Lulua', 'ale': 'Aleut', 'fin': 'Finnish', 'nno': 'Norwegian (Nynorsk)', 'pap': 'Papiamento', 'sot': 'Sotho', 'tat': 'Tatar', 'rar': 'Rarotongan', 'son': 'Songhai', 'roh': 'Raeto-Romance', 'lam': 'Lamba (Zambia and Congo)', '-gag': 'Galician', 'ban': 'Balinese', 'cze': 'Czech', 'tkl': 'Tokelauan', 'osa': 'Osage', 'smi': 'Sami', 'ter': 'Terena', 'enm': 'English, Middle (1100-1500)', 'dzo': 'Dzongkha', 'hsb': 'Upper Sorbian', 'pra': 'Prakrit languages', 'arm': 'Armenian', '-tsw': 'Tswana', 'kho': 'Khotanese', 'wln': 'Walloon', 'grc': 'Greek, Ancient (to 1453)', 'ton': 'Tongan', 'may': 'Malay', '-tag': 'Tagalog', 'arg': 'Aragonese', 'ber': 'Berber (Other)', 'vol': 'Volapük', '-mol': 'Moldavian', 'sgn': 'Sign languages', 'map': 'Austronesian (Other)', 'jrb': 'Judeo-Arabic', 'smj': 'Lule Sami', 'aka': 'Akan', '-gua': 'Guarani', 'mun': 'Munda (Other)', 'cor': 'Cornish', 'roa': 'Romance (Other)', 'alg': 'Algonquian (Other)', 'sat': 'Santali', 'yor': 'Yoruba', 'phi': 'Philippine (Other)', 'mos': 'Mooré', 'gmh': 'German, Middle High (ca. 1050-1500)', 'hin': 'Hindi', 'epo': 'Esperanto', 'ina': 'Interlingua (International Auxiliary Language Association)', 'nso': 'Northern Sotho', 'srd': 'Sardinian', 'mno': 'Manobo languages', 'vai': 'Vai', '-fri': 'Frisian', 'mkh': 'Mon-Khmer (Other)', 'ijo': 'Ijo', 'sio': 'Siouan (Other)', 'cmc': 'Chamic languages', '-lap': 'Sami', 'mwl': 'Mirandese', 'sus': 'Susu', 'ori': 'Oriya', 'oto': 'Otomian languages', '-far': 'Faroese', 'uig': 'Uighur', 'est': 'Estonian', 'bug': 'Bugis', 'cho': 'Choctaw', 'crp': 'Creoles and Pidgins (Other)', 'apa': 'Apache languages', '-tar': 'Tatar', 'urd': 'Urdu', 'cha': 'Chamorro', 'dut': 'Dutch', 'moh': 'Mohawk', 'slv': 'Slovenian', 'lah': 'Lahndā', 'smo': 'Samoan', 'csb': 'Kashubian', 'loz': 'Lozi', 'tog': 'Tonga (Nyasa)', 'bad': 'Banda languages', 'cat': 'Catalan', '-taj': 'Tajik', 'ido': 'Ido', 'bas': 'Basa', 'div': 'Divehi', 'kor': 'Korean', 'nwc': 'Newari, Old', 'arc': 'Aramaic', 'sad': 'Sandawe', 'ndo': 'Ndonga', 'zap': 'Zapotec', 'alb': 'Albanian', 'sms': 'Skolt Sami', 'nds': 'Low German', 'mas': 'Maasai', 'ssa': 'Nilo-Saharan (Other)', 'kmb': 'Kimbundu', 'ace': 'Achinese', 'chy': 'Cheyenne', 'ady': 'Adygei', 'ast': 'Bable', 'gwi': "Gwich'in", 'kik': 'Kikuyu', 'kab': 'Kabyle', 'gsw': 'Swiss German', 'por': 'Portuguese', 'pam': 'Pampanga', 'jpn': 'Japanese', 'mai': 'Maithili', 'que': 'Quechua', 'ine': 'Indo-European (Other)', 'oji': 'Ojibwa', 'mac': 'Macedonian', 'zbl': 'Blissymbolics', 'san': 'Sanskrit', 'chn': 'Chinook jargon', 'dak': 'Dakota', 'chb': 'Chibcha', 'khm': 'Khmer', 'mon': 'Mongolian', 'pus': 'Pushto', 'kan': 'Kannada', 'spa': 'Spanish', 'fro': 'French, Old (ca. 842-1300)', 'day': 'Dayak', 'che': 'Chechen', 'tpi': 'Tok Pisin', 'ful': 'Fula', 'niu': 'Niuean', 'myn': 'Mayan languages', 'kpe': 'Kpelle', 'kar': 'Karen languages', 'bra': 'Braj', 'geo': 'Georgian', 'tsi': 'Tsimshian'};

place_dic = {'af': 'Afghanistan', 'ie': 'Ireland', 'ctu': 'Connecticut', '-tkr': 'Turkmen S.S.R.',
'tk': 'Turkmenistan', 'wyu': 'Wyoming', 'sh': 'Spanish North Africa', '-gn': 'Gilbert and Ellice Islands',
'aa': 'Albania', 'mm': 'Malta', 'nbu': 'Nebraska', '-cz': 'Canal Zone', 'dcu': 'District of Columbia', 'gr': 'Greece',
'abc': 'Alberta', 'ts': 'United Arab Emirates', 'ci': 'Croatia', 'tma': 'Tasmania', '-mvr': 'Moldavian S.S.R.',
'-ln': 'Central and Southern Line Islands', 'riu': 'Rhode Island', 'xc': 'Maldives', 'fr': 'France', 'nw': 'Northern Mariana Islands',
'pw': 'Palau', 'np': 'Nepal', 'ws': 'Samoa', 'xoa': 'Northern Territory', 'ko': 'Korea (South)', 'ai': 'Armenia (Republic)',
'snc': 'Saskatchewan', 'ck': 'Colombia', 'my': 'Malaysia', '-sk': 'Sikkim', 'cm': 'Cameroon', 'cq': 'Comoros', 'ii': 'India',
'mdu': 'Maryland', 'lv': 'Latvia', 'nju': 'New Jersey', 'pk': 'Pakistan', 'nik': 'Northern Ireland', 'am': 'Anguilla',
'-pt': 'Portuguese Timor', '-kgr': 'Kirghiz S.S.R.', 'sr': 'Surinam', 'scu': 'South Carolina', 'cu': 'Cuba', '-err': 'Estonia',
'xb': 'Cocos (Keeling) Islands', 'xa': 'Christmas Island (Indian Ocean)', 'xp': 'Spratly Island', '-ge': 'Germany (East)',
'iau': 'Iowa', 'nfc': 'Newfoundland and Labrador', 'pp': 'Papua New Guinea', 'gm': 'Gambia', 'deu': 'Delaware',
'xe': 'Marshall Islands', 'vm': 'Vietnam', 'qea': 'Queensland', 'jo': 'Jordan', 'tnu': 'Tennessee', 'aj': 'Azerbaijan',
'ksu': 'Kansas', '-vs': 'Vietnam, South', 'tc': 'Turks and Caicos Islands', 'sd': 'South Sudan', 'tu': 'Turkey', 'at': 'Australia',
'ss': 'Western Sahara', 'bt': 'Bhutan', 'wj': 'West Bank of the Jordan River', '-ui': 'United Kingdom Misc. Islands',
'cou': 'Colorado', 'xxu': 'United States', 'au': 'Austria', 'cx': 'Central African Republic', 'ce': 'Sri Lanka', 'bcc': 'British Columbia',
'fa': 'Faroe Islands', 'ic': 'Iceland', 'bs': 'Botswana', 'rb': 'Serbia', 'mp': 'Mongolia', 'xl': 'Saint Pierre and Miquelon',
'gw': 'Germany', 'nhu': 'New Hampshire', 'onc': 'Ontario', 'nr': 'Nigeria', 'vau': 'Virginia', 'gt': 'Guatemala', 'sl': 'Sierra Leone',
'et': 'Ethiopia', '-kzr': 'Kazakh S.S.R.', 'tl': 'Tokelau', 'aku': 'Alaska', 'aca': 'Australian Capital Territory', 'stk': 'Scotland',
'xf': 'Midway Islands', 'xga': 'Coral Sea Islands Territory', '-sv': 'Swan Islands', 'vtu': 'Vermont', 'pn': 'Panama', 'it': 'Italy',
'jm': 'Jamaica', 'mr': 'Morocco', '-gsr': 'Georgian S.S.R.', 'oku': 'Oklahoma', 'gv': 'Guinea', 'wau': 'Washington (State)',
'bo': 'Bolivia', '-nm': 'Northern Mariana Islands', 'tz': 'Tanzania', 'cl': 'Chile', 'dq': 'Dominica', 'bl': 'Brazil',
'em': 'Timor-Leste', 'ku': 'Kuwait', 'lo': 'Lesotho', '-tt': 'Trust Territory of the Pacific Islands', 'meu': 'Maine',
'io': 'Indonesia', '-unr': 'Ukraine', 'tv': 'Tuvalu', 'go': 'Gabon', 'gp': 'Guadeloupe', 'ho': 'Honduras', 'sc': 'Saint-Barthélemy',
'-cp': 'Canton and Enderbury Islands', '-bwr': 'Byelorussian S.S.R.', 'rw': 'Rwanda', 'ot': 'Mayotte', '-ajr': 'Azerbaijan S.S.R.',
'-xi': 'Saint Kitts-Nevis-Anguilla', 'cr': 'Costa Rica', 'su': 'Saudi Arabia', '-iu': 'Israel-Syria Demilitarized Zones',
'sw': 'Sweden', 'sp': 'Spain', 'nu': 'Nauru', 'inu': 'Indiana', 'miu': 'Michigan', 'un': 'Ukraine', 'ta': 'Tajikistan',
'an': 'Andorra', 'vc': 'Vatican City', 'mq': 'Martinique', '-ac': 'Ashmore and Cartier Islands', 'mbc': 'Manitoba',
'xx': 'No place', 'gd': 'Grenada', 'fp': 'French Polynesia', 'mtu': 'Montana', 'enk': 'England',
'-ai': 'Anguilla', 'alu': 'Alabama', 'sdu': 'South Dakota', '-rur': 'Russian S.F.S.R.', 'xd': 'Saint Kitts-Nevis',
'pf': 'Paracel Islands', 'ja': 'Japan', 'mau': 'Massachusetts', 'dk': 'Denmark', 'xn': 'Macedonia', '-vn': 'Vietnam, North',
'mu': 'Mauritania', 'hiu': 'Hawaii', '-na': 'Netherlands Antilles', 'azu': 'Arizona', '-ys': "Yemen (People's Democratic Republic)",
'xh': 'Niue', 'es': 'El Salvador', 'nx': 'Norfolk Island', 'gb': 'Kiribati', 'ke': 'Kenya', 'py': 'Paraguay', 'xv': 'Slovenia',
'lh': 'Liechtenstein', 'aru': 'Arkansas', 'txu': 'Texas', 'bg': 'Bangladesh', 'is': 'Israel', 'ft': 'Djibouti', '-lir': 'Lithuania', 'cj': 'Cayman Islands', 'ohu': 'Ohio', 'mk': 'Oman', 'gau': 'Georgia', 'za': 'Zambi', 'uy': 'Uruguay', 'sg': 'Senegal', '-uk': 'United Kingdom', 'wf': 'Wallis and Futuna', 'fs': 'Terres australes et antarctiques françaises', 'kz': 'Kazakhstan', 'ly': 'Libya', 'utu': 'Utah', 'cb': 'Cambodia', 'ug': 'Uganda', '-cn': 'Canada', 'vra': 'Victoria', '-hk': 'Hong Kong', 'nsc': 'Nova Scotia', 'bi': 'British Indian Ocean Territory', 'cy': 'Cyprus', 'sq': 'Swaziland', 'nn': 'Vanuatu', 'so': 'Somalia', 'pg': 'Guinea-Bissau', '-yu': 'Serbia and Montenegro', 'cd': 'Chad', 'ml': 'Mali', 'gs': 'Georgia (Republic)', 'gz': 'Gaza Strip', 'cw': 'Cook Islands', '-lvr': 'Latvia', 'qa': 'Qatar', 'ye': 'Yemen', 'xs': 'South Georgia and the South Sandwich Islands', 'nvu': 'Nevada', '-sb': 'Svalbard', 'ag': 'Argentina', 'st': 'Saint-Martin', 'lb': 'Liberia', 'mx': 'Mexico', 'ae': 'Algeria', 'uv': 'Burkina Faso', '-cs': 'Czechoslovakia', 'ls': 'Laos', '-ry': 'Ryukyu Islands, Southern', 'pl': 'Poland', 're': 'Réunion', 'lau': 'Louisiana', 'ph': 'Philippines', 'th': 'Thailand', 'fm': 'Micronesia (Federated States)', 'bp': 'Solomon Islands', 'si': 'Singapore', 'nq': 'Nicaragua', 'kv': 'Kosovo', 'kyu': 'Kentucky', 'ba': 'Bahrain', 'hm': 'Heard and McDonald Islands', 'cg': 'Congo (Democratic Republic)', 'mg': 'Madagascar', 'iy': 'Iraq-Saudi Arabia Neutral Zone', 'mv': 'Moldova', 'uik': 'United Kingdom Misc. Islands', 'po': 'Portugal', 'gu': 'Guam', 'xna': 'New South Wales', 'ir': 'Iran', 'wk': 'Wake Island', 'dr': 'Dominican Republic', 'eg': 'Equatorial Guinea', 'iv': "Côte d'Ivoire", 'bu': 'Bulgaria', 'xxc': 'Canada', 'ykc': 'Yukon Territory', 'bm': 'Bermuda Islands', 'pe': 'Peru', 'nyu': 'New York (State)', 'aq': 'Antigua and Barbuda', 'dm': 'Benin', 'bv': 'Bouvet Island', '-uzr': 'Uzbek S.S.R.', 'sx': 'Namibia', '-air': 'Armenian S.S.R.', 'kn': 'Korea (North)', 'fj': 'Fiji', 'bw': 'Belarus', '-wb': 'West Berlin', 'fi': 'Finland', 'mc': 'Monaco', 'nz': 'New Zealand', 'ch': 'China (Republic : 1949- )', 'vi': 'Virgin Islands of the United States', 'ti': 'Tunisia', 'no': 'Norway', 'ng': 'Niger', 'sj': 'Sudan', 'lu': 'Luxembourg', 'gy': 'Guyana', 'xr': 'Czech Republic', 'fk': 'Falkland Islands', 'mou': 'Missouri', 'idu': 'Idaho', 'ao': 'Angola', 'nmu': 'New Mexico', 'le': 'Lebanon', 'ua': 'Egypt', 'xo': 'Slovakia', 'pr': 'Puerto Rico', 'wlk': 'Wales', 'li': 'Lithuania', 'sf': 'Sao Tome and Principe', 'xm': 'Saint Vincent and the Grenadines', 'br': 'Burma', 'be': 'Belgium', 'oru': 'Oregon', 'mw': 'Malawi', 'flu': 'Florida', '-mh': 'Macao', 'ht': 'Haiti', 'pau': 'Pennsylvania', 'cc': 'China', 'xra': 'South Australia', 'bn': 'Bosnia and Herzegovina', 'xxk': 'United Kingdom', 'ncu': 'North Carolina', 'rm': 'Romania', 'mf': 'Mauritius', 'tr': 'Trinidad and Tobago', 'up': 'United States Misc. Pacific Islands', '-jn': 'Jan Mayen', 'uc': 'United States Misc. Caribbean Islands', 'er': 'Estonia', 'mj': 'Montserrat', 'se': 'Seychelles', 'nkc': 'New Brunswick', '-ur': 'Soviet Union', 'fg': 'French Guiana', 'bb': 'Barbados', 'ec': 'Ecuador', 'iq': 'Iraq', 'ilu': 'Illinois', 'as': 'American Samoa', 'bx': 'Brunei', 'bd': 'Burundi', 'ea': 'Eritrea', 'quc': 'Québec (Province)', 'ji': 'Johnston Atoll', 'nuc': 'Nunavut', 'cau': 'California', 'xj': 'Saint Helena', 'ndu': 'North Dakota', 'sz': 'Switzerland', 'wea': 'Western Australia', 'ca': 'Caribbean Netherlands', 'nl': 'New Caledonia', 'sa': 'South Africa', 'sy': 'Syria', 'ne': 'Netherlands', 'mo': 'Montenegro', 'ay': 'Antarctica', 'mz': 'Mozambique', 'gi': 'Gibraltar', 'pic': 'Prince Edward Island', 'sn': 'Sint Maarten', 'kg': 'Kyrgyzstan', 'rh': 'Zimbabwe', 'hu': 'Hungary', 'aw': 'Aruba', '-iw': 'Israel-Jordan Demilitarized Zones', 'vp': 'Various places', '-us': 'United States', 'uz': 'Uzbekistan', 'bf': 'Bahamas', 'co': 'Curaçao', 'sm': 'San Marino', 'msu': 'Mississippi', '-xxr': 'Soviet Union', 'ntc': 'Northwest Territories', 'tg': 'Togo', 'xk': 'Saint Lucia', 'vb': 'British Virgin Islands', 've': 'Venezuela', 'wvu': 'West Virginia', 'mnu': 'Minnesota', 'bh': 'Belize', 'wiu': 'Wisconsin', 'cv': 'Cabo Verde', 'gl': 'Greenland', 'to': 'Tonga', 'cf': 'Congo (Brazzaville)', '-tar': 'Tajik S.S.R.', 'gh': 'Ghana', 'pc': 'Pitcairn Island', 'ru': 'Russia (Federation)'};





