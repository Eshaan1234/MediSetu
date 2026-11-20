import type { Medicine, Pharmacy, StockRow, Transaction } from "./types";

export const MEDICINES: Medicine[] = [
  { id: "dolo650", name: "Dolo 650", salt: "Paracetamol", strength: "650mg", form: "Tablet", manufacturer: "Micro Labs", category: "Fever & Pain", prescription: false, price: 32, mrp: 35, pack: "Strip of 15 tablets", aliases: ["डोलो 650", "டோலோ 650", "డోలో 650", "दोलो", "dolo", "paracetamol 650", "पैरासिटामोल"] },
  { id: "crocinadvance", name: "Crocin Advance 500", salt: "Paracetamol", strength: "500mg", form: "Tablet", manufacturer: "Haleon", category: "Fever & Pain", prescription: false, price: 24, mrp: 27, pack: "Strip of 15 tablets", aliases: ["क्रोसिन", "க்ரோசின்", "క్రోసిన్", "paracetamol 500", "पैरासिटामोल"] },
  { id: "calpol650", name: "Calpol 650", salt: "Paracetamol", strength: "650mg", form: "Tablet", manufacturer: "GlaxoSmithKline", category: "Fever & Pain", prescription: false, price: 30, mrp: 33, pack: "Strip of 15 tablets", aliases: ["कैल्पोल", "கால்போல்", "కాల్పోల్", "paracetamol"] },
  { id: "pan40", name: "Pan 40", salt: "Pantoprazole", strength: "40mg", form: "Tablet", manufacturer: "Alkem Labs", category: "Stomach & Digestion", prescription: true, price: 138, mrp: 155, pack: "Strip of 15 tablets", aliases: ["पैन 40", "பான் 40", "పాన్ 40", "pantoprazole 40", "पैंटोप्राज़ोल"] },
  { id: "pantocid40", name: "Pantocid 40", salt: "Pantoprazole", strength: "40mg", form: "Tablet", manufacturer: "Sun Pharma", category: "Stomach & Digestion", prescription: true, price: 145, mrp: 162, pack: "Strip of 15 tablets", aliases: ["पैंटोसिड", "పాంటోసిడ్", "pantoprazole"] },
  { id: "zincovit", name: "Zincovit Tablet", salt: "Multivitamins + Zinc", strength: "—", form: "Tablet", manufacturer: "Apex Labs", category: "Vitamins", prescription: false, price: 105, mrp: 120, pack: "Strip of 15 tablets", aliases: ["ज़incoविट", "जिंकोविट", "ஜின்கோவிட்", "జింకోవిట్", "multivitamin", "मल्टीविटामिन"] },
  { id: "shelcal500", name: "Shelcal 500", salt: "Calcium + Vitamin D3", strength: "500mg", form: "Tablet", manufacturer: "Torrent Pharma", category: "Vitamins", prescription: false, price: 128, mrp: 142, pack: "Strip of 15 tablets", aliases: ["शेलकैल", "ஷெல்கல்", "షెల్కాల్", "calcium tablets", "कैल्शियम"] },
  { id: "augmentin625", name: "Augmentin 625 Duo", salt: "Amoxycillin + Clavulanic Acid", strength: "625mg", form: "Tablet", manufacturer: "GlaxoSmithKline", category: "Antibiotics", prescription: true, price: 178, mrp: 198, pack: "Strip of 10 tablets", aliases: ["ऑगमेंटिन", "ஆக்மெண்டின்", "ఆగ్మెంటిన్", "amoxicillin clavulanic", "clavam 625"] },
  { id: "azithral500", name: "Azithral 500", salt: "Azithromycin", strength: "500mg", form: "Tablet", manufacturer: "Alembic Pharma", category: "Antibiotics", prescription: true, price: 122, mrp: 139, pack: "Strip of 5 tablets", aliases: ["अज़िथ्रल", "அசித்ரல்", "అజిత్రల్", "azithromycin 500", "एज़िथ्रोमाइसिन"] },
  { id: "azee500", name: "Azee 500", salt: "Azithromycin", strength: "500mg", form: "Tablet", manufacturer: "Cipla", category: "Antibiotics", prescription: true, price: 114, mrp: 130, pack: "Strip of 5 tablets", aliases: ["अज़ी", "అజీ", "azithromycin"] },
  { id: "cetirizine10", name: "Cetzine 10", salt: "Cetirizine", strength: "10mg", form: "Tablet", manufacturer: "Dr. Reddy's", category: "Allergy", prescription: false, price: 28, mrp: 32, pack: "Strip of 10 tablets", aliases: ["सेटिरिज़िन", "சிடிரிசின்", "సెటిరిజిన్", "cetirizine 10", "एलर्जी"] },
  { id: "montekLC", name: "Montek LC", salt: "Montelukast + Levocetirizine", strength: "10mg/5mg", form: "Tablet", manufacturer: "Sun Pharma", category: "Allergy", prescription: true, price: 168, mrp: 187, pack: "Strip of 10 tablets", aliases: ["मोंटेक", "மோன்டெக்", "మోంటెక్", "montelukast"] },
  { id: "telma40", name: "Telma 40", salt: "Telmisartan", strength: "40mg", form: "Tablet", manufacturer: "Glenmark", category: "Heart & BP", prescription: true, price: 145, mrp: 162, pack: "Strip of 15 tablets", aliases: ["टेल्मा", "டெல்மா", "టెల్మా", "telmisartan 40", "बीपी"] },
  { id: "glycomet500", name: "Glycomet 500", salt: "Metformin", strength: "500mg", form: "Tablet", manufacturer: "Sun Pharma", category: "Diabetes", prescription: true, price: 38, mrp: 44, pack: "Strip of 15 tablets", aliases: ["ग्लाइकोमेट", "கிளைகோமெட்", "గ్లైకోమెట్", "metformin 500", "मेटफॉर्मिन", "शुगर"] },
  { id: "thyronorm50", name: "Thyronorm 50", salt: "Thyroxine", strength: "50mcg", form: "Tablet", manufacturer: "Abbott", category: "Thyroid", prescription: true, price: 142, mrp: 158, pack: "Bottle of 120 tablets", aliases: ["थाइरोनॉर्म", "தைரோனார்ம்", "థైరోనార్మ్", "thyroxine 50", "थायरॉक्सिन"] },
  { id: "ecosprin75", name: "Ecosprin 75", salt: "Aspirin", strength: "75mg", form: "Tablet", manufacturer: "USV", category: "Heart & BP", prescription: true, price: 22, mrp: 26, pack: "Strip of 14 tablets", aliases: ["इकोस्प्रिन", "எக்கோஸ்பிரின்", "ఎకోస్ప్రిన్", "aspirin 75"] },
  { id: "digene", name: "Digene Gel", salt: "Antacid + Simethicone", strength: "—", form: "Gel", manufacturer: "Abbott", category: "Stomach & Digestion", prescription: false, price: 135, mrp: 150, pack: "Bottle of 200 ml", aliases: ["डाइजीन", "டைஜீன்", "డైజిన్", "antacid", "एसिडिटी"] },
  { id: "electral", name: "Electral Powder", salt: "ORS", strength: "—", form: "Powder", manufacturer: "FDC", category: "Hydration", prescription: false, price: 22, mrp: 25, pack: "Sachet of 21.8 g", aliases: ["इलेक्ट्रल", "எலக்ட்ரல்", "ఎలెక్ట్రల్", "ors", "ओआरएस"] },
  { id: "benadryl", name: "Benadryl Cough Syrup", salt: "Diphenhydramine", strength: "—", form: "Syrup", manufacturer: "Johnson & Johnson", category: "Cough & Cold", prescription: false, price: 118, mrp: 132, pack: "Bottle of 100 ml", aliases: ["बेनाड्रिल", "பெனட்ரில்", "బెనడ్రిల్", "cough syrup", "खांसी"] },
  { id: "chestoncold", name: "Cheston Cold", salt: "Paracetamol + Phenylephrine + Chlorpheniramine", strength: "—", form: "Tablet", manufacturer: "Cipla", category: "Cough & Cold", prescription: false, price: 78, mrp: 88, pack: "Strip of 10 tablets", aliases: ["चेस्टन", "செஸ்டன்", "చెస్టన్", "cold tablet", "सर्दी"] },
  { id: "volini", name: "Volini Spray", salt: "Diclofenac + Menthol", strength: "—", form: "Spray", manufacturer: "Sun Pharma", category: "Pain Relief", prescription: false, price: 215, mrp: 240, pack: "Bottle of 60 g", aliases: ["वोलिनी", "வோலினி", "వోలిని", "pain spray", "दर्द"] },
  { id: "vicoks", name: "Vicks VapoRub", salt: "Menthol + Camphor", strength: "—", form: "Ointment", manufacturer: "P&G", category: "Cough & Cold", prescription: false, price: 142, mrp: 160, pack: "Jar of 50 g", aliases: ["विक्स", "விக்ஸ்", "విక్స్", "vaporub", "बाम"] },
  { id: "becosules", name: "Becosules Capsule", salt: "Vitamin B Complex", strength: "—", form: "Capsule", manufacturer: "Pfizer", category: "Vitamins", prescription: false, price: 68, mrp: 78, pack: "Strip of 20 capsules", aliases: ["बेकोसुल्स", "பெகோசுல்ஸ்", "బెకోసుల్స్", "vitamin b", "विटामिन"] },
  { id: "supradyn", name: "Supradyn Daily", salt: "Multivitamins", strength: "—", form: "Tablet", manufacturer: "Abbott", category: "Vitamins", prescription: false, price: 185, mrp: 210, pack: "Bottle of 30 tablets", aliases: ["सुप्राडाइन", "சுப்ராடைன்", "సుప్రాడైన్", "multivitamin"] },
  { id: "ibugesic", name: "Ibugesic Plus", salt: "Ibuprofen + Paracetamol", strength: "400mg/325mg", form: "Tablet", manufacturer: "Cipla", category: "Fever & Pain", prescription: true, price: 42, mrp: 48, pack: "Strip of 10 tablets", aliases: ["इबुजेसिक", "இபுகெசிக்", "ఇబుగెసిక్", "ibuprofen"] },
  { id: "clavam625", name: "Clavam 625", salt: "Amoxycillin + Clavulanic Acid", strength: "625mg", form: "Tablet", manufacturer: "Alkem Labs", category: "Antibiotics", prescription: true, price: 162, mrp: 180, pack: "Strip of 10 tablets", aliases: ["क्लैवम", "க்ளாவம்", "క్లావమ్", "augmentin"] },
  { id: "levocet", name: "Levocet 5", salt: "Levocetirizine", strength: "5mg", form: "Tablet", manufacturer: "Cipla", category: "Allergy", prescription: false, price: 48, mrp: 55, pack: "Strip of 10 tablets", aliases: ["लेवोसेट", "லெவோசெட்", "లెవోసెట్", "levocetirizine"] },
  { id: "revital", name: "Revital H", salt: "Multivitamins + Ginseng", strength: "—", form: "Capsule", manufacturer: "Sun Pharma", category: "Vitamins", prescription: false, price: 265, mrp: 295, pack: "Bottle of 30 capsules", aliases: ["रिवाइटल", "ரிவைடல்", "రివైటల్"] },
  { id: "panparag", name: "Paracip 650", salt: "Paracetamol", strength: "650mg", form: "Tablet", manufacturer: "Cipla", category: "Fever & Pain", prescription: false, price: 27, mrp: 31, pack: "Strip of 10 tablets", aliases: ["पैरासिप", "பாராசிப்", "ప్యారాసిప్", "paracetamol"] },
  { id: "sinarest", name: "Sinarest Tablet", salt: "Paracetamol + Phenylephrine + Chlorpheniramine", strength: "—", form: "Tablet", manufacturer: "Centaur Pharma", category: "Cough & Cold", prescription: false, price: 62, mrp: 70, pack: "Strip of 10 tablets", aliases: ["साइनेरेस्ट", "சைனரெஸ்ட்", "సైనరెస్ట్"] },
  { id: "nise", name: "Nise Gel", salt: "Nimesulide", strength: "1%", form: "Gel", manufacturer: "Dr. Reddy's", category: "Pain Relief", prescription: false, price: 168, mrp: 188, pack: "Tube of 30 g", aliases: ["नाइस", "நைஸ்", "నైస్", "nimesulide"] },
  { id: "rinoflam", name: "Rinoflam Nasal Spray", salt: "Xylometazoline", strength: "0.1%", form: "Spray", manufacturer: "Cipla", category: "Cough & Cold", prescription: false, price: 132, mrp: 148, pack: "Bottle of 10 ml", aliases: ["राइनोफ्लेम", "రైనోఫ్లామ్", "xylometazoline"] },
];

const P = (
  id: string, name: string, chain: string, address: string, city: string, state: string,
  pincode: string, lat: number, lng: number, rating: number, delivery: boolean,
): Pharmacy => ({
  id, name, chain, address, city, state, pincode, lat, lng, rating, delivery,
  phone: `+91 ${90000 + (id.length * 1379)}-${10000 + id.length * 733}`,
  hours: "08:00 – 22:00",
  source: "seed",
});

export const PHARMACIES: Pharmacy[] = [
  P("ph-pune-apollo", "Apollo Pharmacy, JM Road", "Apollo Pharmacy", "Above Standard Chartered, JM Road, Shivajinagar", "Pune", "Maharashtra", "411005", 18.5204, 73.8567, 4.6, true),
  P("ph-pune-medplus", "MedPlus, Deccan Gymkhana", "MedPlus", "Near Sai Service, Deccan Gymkhana", "Pune", "Maharashtra", "411004", 18.5312, 73.8443, 4.4, true),
  P("ph-pune-disp", "Pune Medical Dispensary", "Local Chemist", "Bhandarkar Road, Shivajinagar", "Pune", "Maharashtra", "411004", 18.5069, 73.8572, 4.7, false),
  P("ph-pune-wellness", "Wellness Forever, Baner", "Wellness Forever", "Baner Road near D-Mart", "Pune", "Maharashtra", "411045", 18.5596, 73.7742, 4.5, true),
  P("ph-mumbai-apollo", "Apollo Pharmacy, Dadar", "Apollo Pharmacy", "Dr. Ambedkar Road, Dadar East", "Mumbai", "Maharashtra", "400014", 19.0178, 72.8571, 4.5, true),
  P("ph-mumbai-medplus", "MedPlus, Bandra", "MedPlus", "Linking Road, Bandra West", "Mumbai", "Maharashtra", "400050", 19.0330, 72.8697, 4.3, true),
  P("ph-delhi-apollo", "Apollo Pharmacy, Connaught Place", "Apollo Pharmacy", "Block A, Connaught Place", "New Delhi", "Delhi", "110001", 28.6315, 77.2167, 4.6, true),
  P("ph-delhi-medplus", "MedPlus, Karol Bagh", "MedPlus", "Ajmal Khan Road, Karol Bagh", "New Delhi", "Delhi", "110005", 28.6517, 77.1909, 4.2, true),
  P("ph-blr-apollo", "Apollo Pharmacy, MG Road", "Apollo Pharmacy", "Mahatma Gandhi Road, Bruhat Bengaluru", "Bengaluru", "Karnataka", "560001", 12.9759, 77.6050, 4.5, true),
  P("ph-blr-medplus", "MedPlus, Jayanagar", "MedPlus", "11th Main, Jayanagar 4th Block", "Bengaluru", "Karnataka", "560011", 12.9250, 77.5938, 4.4, true),
  P("ph-chen-apollo", "Apollo Pharmacy, T Nagar", "Apollo Pharmacy", "Pondy Bazaar, T. Nagar", "Chennai", "Tamil Nadu", "600017", 13.0418, 80.2341, 4.6, true),
  P("ph-chen-medplus", "MedPlus, Anna Nagar", "MedPlus", "Second Avenue, Anna Nagar", "Chennai", "Tamil Nadu", "600040", 13.0104, 80.2203, 4.3, true),
  P("ph-hyd-apollo", "Apollo Pharmacy, Banjara Hills", "Apollo Pharmacy", "Road No. 12, Banjara Hills", "Hyderabad", "Telangana", "500034", 17.4239, 78.4738, 4.5, true),
  P("ph-hyd-medplus", "MedPlus, Gachibowli", "MedPlus", "Gachibowli Main Road", "Hyderabad", "Telangana", "500032", 17.4470, 78.3800, 4.2, true),
  P("ph-kol-apollo", "Apollo Pharmacy, Park Street", "Apollo Pharmacy", "Park Street Area", "Kolkata", "West Bengal", "700016", 22.5470, 88.3615, 4.4, true),
  P("ph-ahm-apollo", "Apollo Pharmacy, Satellite", "Apollo Pharmacy", "S.G. Highway, Satellite", "Ahmedabad", "Gujarat", "380015", 23.0225, 72.5714, 4.5, true),
  P("ph-jai-medplus", "MedPlus, C-Scheme", "MedPlus", "Ashram Marg, C-Scheme", "Jaipur", "Rajasthan", "302001", 26.9124, 75.7873, 4.3, true),
  P("ph-lko-apollo", "Apollo Pharmacy, Gomti Nagar", "Apollo Pharmacy", "Gomti Nagar", "Lucknow", "Uttar Pradesh", "226010", 26.8467, 80.9462, 4.4, true),
  P("ph-kochi-medplus", "MedPlus, MG Road", "MedPlus", "Mahatma Gandhi Road, Ernakulam", "Kochi", "Kerala", "682016", 9.9312, 76.2673, 4.5, true),
  P("ph-chd-apollo", "Apollo Pharmacy, Sector 17", "Apollo Pharmacy", "Sector 17 Market", "Chandigarh", "Punjab", "160017", 30.7333, 76.7794, 4.4, true),
  P("ph-ind-medplus", "MedPlus, AB Road", "MedPlus", "AB Road, near Navlakha", "Indore", "Madhya Pradesh", "452001", 22.7196, 75.8577, 4.2, true),
  P("ph-nag-apollo", "Apollo Pharmacy, Sitabuldi", "Apollo Pharmacy", "Sitabuldi Main Road", "Nagpur", "Maharashtra", "440012", 21.1458, 79.0882, 4.4, true),
  P("ph-guw-local", "Guwahati Chemist House", "Local Chemist", "G.S. Road, Ulubari", "Guwahati", "Assam", "781007", 26.1445, 91.7362, 4.6, false),
  P("ph-pat-local", "Patna Medical Store", "Local Chemist", "Boring Road", "Patna", "Bihar", "800001", 25.5941, 85.1376, 4.3, false),
  P("ph-bbs-local", "Bhubaneswar Pharmacy", "Local Chemist", "Sachivalaya Marg", "Bhubaneswar", "Odisha", "751001", 20.9517, 85.0985, 4.4, false),
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function buildSeedStock(): StockRow[] {
  const rows: StockRow[] = [];
  PHARMACIES.forEach((ph, pi) => {
    MEDICINES.forEach((med, mi) => {
      if ((hash(ph.id + med.id) % 100) > 62) return; // ~62% coverage
      const quantity = 5 + (hash(med.id + ph.id) % 124);
      const priceDelta = (hash(ph.id + med.id + "p") % 9) - 4;
      rows.push({
        pharmacyId: ph.id,
        medicineId: med.id,
        quantity,
        reorderLevel: 12 + (hash(med.id + "r") % 16),
        price: Math.max(5, med.price + priceDelta),
        unit: med.form === "Syrup" || med.form === "Gel" ? "bottle" : "strip",
        updatedAt: new Date(Date.now() - (hash(ph.id + med.id + "t") % 72) * 3600_000).toISOString(),
      });
    });
    if (pi < 3) {
      // Guarantee a low-stock and an out-of-stock example in Pune for the demo.
      const target = rows.find((r) => r.pharmacyId === ph.id && r.medicineId === "dolo650");
      if (target) target.quantity = pi === 0 ? 8 : pi === 1 ? 0 : 41;
    }
  });
  return rows;
}

export function buildSeedTransactions(): Transaction[] {
  const rows: Transaction[] = [];
  for (let day = 6; day >= 0; day--) {
    for (let i = 0; i < 26; i++) {
      const pi = (i * 7 + day * 3) % PHARMACIES.length;
      const mi = (i * 11 + day * 5) % MEDICINES.length;
      const sale = (i + day) % 5 !== 0;
      const qty = 1 + ((i * 3 + day) % 9);
      rows.push({
        id: `seed-${day}-${i}`,
        pharmacyId: PHARMACIES[pi].id,
        medicineId: MEDICINES[mi].id,
        type: sale ? "sale" : "purchase",
        delta: sale ? -qty : qty * 5,
        quantity: qty,
        note: sale ? "Counter sale" : "Distributor replenishment",
        raw: "",
        source: "seed",
        confidence: 1,
        createdAt: new Date(Date.now() - day * 86_400_000 - i * 1_000_000).toISOString(),
      });
    }
  }
  return rows;
}
