// Fake-name generator for simulated candidates.
// makeNamer(rng, reserved) -> name(region, urbanity 0..1)
// Mixes formats (First Last, First Middle Last, First M. Last, initials, nicknames,
// double-barrelled surnames, Spanish/Portuguese double surnames, suffixes), keeps every full
// name unique, caps how often a surname repeats, and never reuses a reserved (real NPC) surname,
// so family links only appear where they were made deliberately.
const sp = s => s.split(/\s*,\s*/);
const C = {
  anglo: {
    m: sp("Marcus, Callum, Declan, Theo, Jonah, Nathaniel, Desmond, Felix, Graham, Silas, Thomas, William, Robert, Michael, David, Daniel, Peter, Andrew, Christopher, Stephen, Richard, Edward, James, Benjamin, Samuel, Oliver, Henry, Gareth, Neil, Simon, Hugh, Rupert, Douglas, Martin, Keith, Craig, Tobias, Conrad, Barnaby, Adrian, Russell, Ian, Leonard, Warren, Clive, Trevor, Vincent, Frank, Gordon, Ryan, Tyler, Jordan, Dylan, Garrett, Patrick, Owen, Isaac, Reuben, Elliot, Ross, Malcolm, Dominic, Francis, Gerald, Lewis, Alistair, Harvey, Rowan, Spencer, Wesley, Brendan, Colin, Derek, Glenn, Joel, Kieran, Lachlan, Nigel, Quentin, Stuart"),
    f: sp("Eleanor, Harriet, Imogen, Rosalind, Abigail, Maeve, Wren, Tamsin, Odette, Margaret, Catherine, Elizabeth, Patricia, Susan, Rachel, Laura, Hannah, Sophie, Emily, Fiona, Joanna, Claire, Megan, Alice, Grace, Charlotte, Lucy, Bethany, Kirsty, Amelia, Philippa, Georgina, Heather, Joanne, Natalie, Leah, Esther, Miriam, Vivian, Delia, Penelope, Rosemary, Bridget, Yvonne, Gwendolyn, Paula, Ruth, Diane, Jessica, Kayla, Brooke, Madison, Shelby, Courtney, Hazel, Iris, Juliet, Kathleen, Lydia, Nora, Olive, Pamela, Rebecca, Sarah, Tessa, Ursula, Victoria, Willa, Zoe, Annabel, Beatrice, Cordelia, Daphne, Felicity, Gemma, Helena, Ingrid, Jemima, Lorna"),
    s: sp("Ashworth, Pemberton, Calloway, Whitcombe, Hartigan, Fairbanks, Thorne, Galloway, Brennan, Holloway, Sutcliffe, Kingsley, Rowntree, Vance, Ellery, Atherton, Blackwood, Bramley, Cartwright, Chadwick, Coleridge, Crowther, Danvers, Dempsey, Doherty, Drummond, Dunmore, Eastwood, Fenwick, Fletcher, Forsythe, Garland, Gilchrist, Goodwin, Granger, Hadley, Halloran, Harcourt, Hargreaves, Haskell, Hawthorne, Hayward, Healey, Hendry, Hollis, Hopkins, Howarth, Ingram, Jessop, Keane, Kendrick, Lambert, Langley, Latimer, Lockhart, Lowther, MacAllister, Maddox, Marlow, McAuley, McBride, McCready, McKenna, Mosley, Mulligan, Nash, Norwood, Oakes, Ogden, Osborne, Paxton, Pell, Prescott, Pryor, Quinlan, Radcliffe, Rafferty, Ramsey, Redmond, Ridley, Rigby, Rourke, Sandford, Sayers, Selby, Sheridan, Shipley, Somerville, Stanhope, Sterling, Stokes, Strickland, Swinton, Tasker, Templeton, Thackeray, Tierney, Townsend, Truscott, Underwood, Vickers, Wakefield, Walsh, Warburton, Weatherby, Wetherell, Whitlock, Wilding, Winslow, Woodhouse, Yardley, Abbott, Barlow, Beckett, Bellamy, Brannigan, Burke, Callaghan, Carver, Collier, Conroy, Cooke, Dalton, Everett, Farrow, Finch, Gale, Gould, Hale, Harlow, Kirby, Lister, Marsh, Moody, Nolan, Parr, Penrose, Reeve, Royce, Seward, Tolliver, Wade, Whelan, Yates, Bancroft, Coombs, Delaney, Fairweather, Gresham, Hennessy, Kilbride, Lomax, Marchbank, Northcott, Orchard, Pickering, Rutherford, Sheffield, Tennant, Upton, Wainwright"),
    nick: { Robert: "Bob", Michael: "Mike", David: "Dave", Daniel: "Dan", Peter: "Pete", Andrew: "Andy", Christopher: "Chris", Stephen: "Steve", Richard: "Rick", Edward: "Ed", James: "Jim", Benjamin: "Ben", Samuel: "Sam", Nathaniel: "Nate", Douglas: "Doug", Leonard: "Len", Patrick: "Pat", Francis: "Frank", Gerald: "Gerry", Elizabeth: "Liz", Margaret: "Maggie", Catherine: "Kate", Patricia: "Trish", Susan: "Sue", Abigail: "Abby", Penelope: "Penny", Philippa: "Pippa", Rebecca: "Becky", Victoria: "Vicky", Kathleen: "Kath", Jessica: "Jess", Pamela: "Pam" },
  },
  french: {
    m: sp("Mathis, Théo, Julien, Antoine, Rémi, Bastien, Gaël, Yannick, Thierry, Laurent, Olivier, Benoît, Pascal, Guillaume, Étienne, Lucien, Arnaud, Fabrice, Gilles, Hugo, Louis, Quentin, Raphaël, Corentin, Erwan, Loïc, Ronan, Tanguy, Yves, Jean-Luc, Jean-François, Pierre-Alexandre, Marc-André, Denis, Florian, Grégoire, Mathéo, Sébastien, Vincent, Xavier, Alain, Bertrand, Clément, Damien, Émile, Fabien, Gaëtan, Hervé, Jérôme, Kévin, Maxime, Nicolas, Philippe, Rodolphe, Sylvain, Tristan, Valentin"),
    f: sp("Élodie, Camille, Margaux, Solène, Clémence, Inès, Aurélie, Maëlle, Hélène, Sandrine, Nathalie, Céline, Isabelle, Véronique, Amélie, Juliette, Gisèle, Brigitte, Danielle, Josée, Léa, Chloé, Manon, Océane, Mathilde, Gwenaëlle, Nolwenn, Soizic, Annick, Mireille, Marie-Ève, Anne-Sophie, Marie-Claude, Anaïs, Bérénice, Capucine, Delphine, Estelle, Florence, Geneviève, Héloïse, Laetitia, Lison, Mélanie, Noémie, Pauline, Romane, Séverine, Sylvie, Valérie, Yvette, Zoé"),
    s: sp("Lefebvre, Morel, Dufresne, Bélanger, Kerbrat, Le Goff, Gauthier, Tremblay, Rousseau, Picard, Lacroix, Fournier, Le Roux, Moreau, Ouellet, Brassard, Arsenault, Beaulieu, Bergeron, Boucher, Bouchard, Caron, Chartier, Côté, Desjardins, Fontaine, Gagnon, Girard, Guérin, Lalonde, Langlois, Laroche, Leclair, Lemaire, Marchand, Mercier, Michaud, Paquette, Pelletier, Poirier, Renaud, Rivière, Savard, Thibault, Vasseur, Le Bihan, Le Gall, Kerjean, Le Floch, Quéméner, Le Meur, Le Bris, Prigent, Le Corre, Cadiou, Jaouen, Morvan, Le Duff, Riou, Hamon, Daoudal, Garnier, Delacroix, Beaumont, Chevalier, Dumont, Faure, Perrault, Valois, Archambault, Charbonneau, Aubert, Bertin, Carpentier, Deschamps, Duval, Fabre, Gervais, Hébert, Joly, Lemieux, Lévesque, Masson, Noël, Paradis, Proulx, Simard, Tessier, Vallée"),
  },
  spanish: {
    m: sp("Alejandro, Mateo, Diego, Rafael, Joaquín, Esteban, Tomás, Andrés, Javier, Fernando, Raúl, Héctor, Emilio, Ricardo, Sergio, Gonzalo, Rodrigo, Guillermo, Álvaro, Ignacio, Pablo, Martín, Hugo, Óscar, Felipe, Armando, Santiago, Cristóbal, Leonardo, Mauricio, José Luis, Juan Pablo, Luis Miguel, Adrián, Agustín, Benjamín, Carlos, Damián, Eduardo, Facundo, Gerardo, Iván, Jaime, Julián, Lorenzo, Manuel, Nicolás, Octavio, Ramiro, Salvador, Víctor"),
    f: sp("Lucía, Valentina, Ximena, Camila, Paloma, Marisol, Inés, Rocío, Carmen, Gabriela, Daniela, Beatriz, Lorena, Pilar, Natalia, Elena, Mariana, Teresa, Sofía, Julieta, Renata, Alba, Victoria, Yolanda, Luz, Graciela, Abril, Montserrat, Itzel, María José, Ana María, Alicia, Belén, Catalina, Dolores, Esperanza, Florencia, Guadalupe, Irene, Josefina, Leticia, Macarena, Nerea, Olivia, Patricia, Regina, Silvia, Soledad, Verónica"),
    s: sp("Castillo, Navarro, Ortega, Salazar, Delgado, Fuentes, Vidal, Montoya, Ibarra, Cabrera, Serrano, Quintero, Robles, Aguilar, Paredes, Alvarado, Arellano, Barrios, Bustamante, Calderón, Cárdenas, Carrillo, Cervantes, Contreras, Córdoba, Domínguez, Escobar, Espinoza, Estrada, Figueroa, Gallardo, Guerrero, Guzmán, Hidalgo, Iglesias, Jiménez, Lara, León, Lozano, Maldonado, Marín, Medina, Mejía, Mendoza, Miranda, Molina, Montes, Morales, Moreno, Muñoz, Nieto, Núñez, Ochoa, Orozco, Pacheco, Palacios, Peña, Ponce, Quiroga, Ramos, Reyes, Ríos, Rivas, Rojas, Romero, Rosales, Sáenz, Sandoval, Santana, Solís, Soto, Suárez, Tapia, Toledo, Trujillo, Valdés, Valencia, Vargas, Vázquez, Velasco, Vera, Villanueva, Zamora, Zúñiga, Benavides, Arriaga, Echeverría, Olmedo, Pizarro, Uribe, Acosta, Bermúdez, Cisneros, Durán, Galindo, Lucero, Mora, Rentería, Saavedra, Varela"),
    double: 0.3,
  },
  portuguese: {
    m: sp("João, Tiago, Rui, Duarte, Gonçalo, Afonso, Rodrigo, Bernardo, Diogo, Miguel, Henrique, Vasco, Nuno, Pedro, Fernando, Luís, Paulo, Sérgio, Jorge, André, Rafael, Tomás, Simão, Fábio, Marco, Hugo, João Pedro, Álvaro, Caetano, Gil, Lourenço, Martim, Renato, Valter"),
    f: sp("Beatriz, Mariana, Leonor, Carolina, Matilde, Inês, Francisca, Catarina, Sofia, Margarida, Joana, Rita, Teresa, Helena, Mafalda, Raquel, Filipa, Alice, Marta, Lúcia, Clara, Isabel, Vitória, Patrícia, Ana Rita, Maria Inês, Benedita, Constança, Graça, Irene, Luana, Madalena, Rosa, Yara"),
    s: sp("Ferreira, Moura, Carvalho, Teixeira, Lacerda, Pimentel, Barros, Azevedo, Cardoso, Magalhães, Sequeira, Valente, Almeida, Antunes, Baptista, Borges, Brandão, Cabral, Correia, Couto, Cruz, Dias, Domingues, Esteves, Faria, Figueiredo, Fonseca, Freitas, Gaspar, Gomes, Guerra, Henriques, Leal, Lobo, Lopes, Machado, Marques, Matos, Medeiros, Melo, Monteiro, Morais, Neves, Nogueira, Nunes, Oliveira, Paiva, Peixoto, Pereira, Pinheiro, Pinto, Quaresma, Rebelo, Ribeiro, Rocha, Sampaio, Simões, Soares, Tavares, Torres, Vaz, Vieira, Xavier, Amaral, Bettencourt, Coelho, Frade, Garrido, Louro, Mesquita, Portela"),
    particles: ["da Silva", "dos Santos", "de Sousa", "da Costa", "do Carmo", "dos Reis", "da Cunha"],
    double: 0.25,
  },
  welsh: {
    m: sp("Rhys, Owain, Gethin, Dafydd, Iestyn, Emrys, Aled, Dylan, Huw, Ifan, Morgan, Trystan, Geraint, Bryn, Caradog, Elis, Hywel, Ioan, Macsen, Osian, Rhodri, Tomos, Wyn, Gwilym, Idris"),
    f: sp("Carys, Seren, Nia, Ffion, Lowri, Mared, Bethan, Cerys, Eirlys, Gwen, Lleucu, Meinir, Rhiannon, Siân, Tegan, Elin, Angharad, Delyth, Glesni, Llinos, Non, Sioned, Catrin, Heledd, Manon"),
    s: sp("Pryce, Llewellyn, Vaughan, Rees, Griffiths, Bowen, Hughes, Prosser, Gwynne, Meredith, Tudor, Bevan, Cadwaladr, Davies, Edwards, Evans, Gruffydd, Howells, Humphreys, Lewis, Lloyd, Mathias, Owen, Parry, Powell, Price, Pugh, Roberts, Rowlands, Watkins, Ellis, Probert, Madoc, Penry, Rhydderch, Trevelyan"),
  },
  dutch: {
    m: sp("Daan, Joris, Pieter, Bram, Thijs, Sjoerd, Jeroen, Wouter, Ruben, Koen, Bas, Hendrik, Maarten, Floris"),
    f: sp("Femke, Sanne, Lotte, Anouk, Maartje, Ilse, Marloes, Eline, Fleur, Lieke, Noor, Willemijn, Annelies, Roos"),
    s: sp("de Vries, van Dijk, Bakker, Visser, Smit, Mulder, van Leeuwen, Hendriks, de Jong, Jansen, de Boer, van den Berg, Meijer, Vos, Dekker, Brouwer, van der Meer, Kuipers, Verhoeven, Schouten, Postma, de Groot, Bosman, van Rijn"),
  },
  eastasian: { m: sp("Wei, Hiroshi, Min-jun, Haruto, Jun, Kenji, Takeshi, Ren, Hao, Seung-ho, Daichi, Tao"), f: sp("Mei, Yuki, Ji-woo, Sakura, Lin, Soo-ah, Hana, Xiu, Aiko, Yeon, Mio, Qing"), s: sp("Chen, Wang, Nakamura, Tanaka, Park, Zhao, Watanabe, Yoshida, Choi, Huang, Lam, Ito, Sato, Han, Ng, Kwon, Takahashi, Zhou") },
  southasian: { m: sp("Arjun, Rohan, Vikram, Sanjay, Rahul, Amir, Imran, Zain, Dev, Kabir, Faisal, Nikhil"), f: sp("Priya, Ananya, Kavya, Meera, Divya, Nisha, Farah, Sana, Aisha, Leela, Ritu, Zara"), s: sp("Patel, Sharma, Iyer, Khan, Chaudhry, Reddy, Malhotra, Siddiqui, Nair, Kapoor, Rao, Hussain, Bhatt, Qureshi, Menon, Gill") },
  african: { m: sp("Chidi, Kwame, Tunde, Kofi, Sekou, Jabari, Obinna, Emeka, Kwabena, Yaw"), f: sp("Amara, Ngozi, Adaeze, Zainab, Folake, Thandiwe, Abena, Chiamaka, Efua, Nneka"), s: sp("Okafor, Mensah, Adeyemi, Okonkwo, Diallo, Boateng, Nwosu, Asante, Eze, Balogun, Owusu, Kamara, Ndiaye, Oduya") },
  slavic: { m: sp("Tomasz, Luka, Dmitri, Marek, Bojan, Pavel, Jakub, Milan"), f: sp("Katarzyna, Milena, Ivana, Zofia, Petra, Jelena, Agnieszka, Vesna"), s: sp("Novak, Horvat, Petrović, Dvořák, Kovač, Zieliński, Marković, Babić, Wróbel, Hájek, Szymański, Kolar") },
  nordic: { m: sp("Lars, Henrik, Sven, Anders, Erik, Magnus, Nils, Torsten"), f: sp("Ingrid, Astrid, Freya, Sigrid, Liv, Maja, Solveig, Elin"), s: sp("Halvorsen, Bergström, Nyberg, Dahl, Sørensen, Holm, Eklund, Lund, Strand, Aalto, Lindgren, Vik") },
  german: { m: sp("Matthias, Klaus, Jürgen, Florian, Tobias, Stefan, Lukas, Dieter"), f: sp("Greta, Anja, Lena, Katrin, Heike, Sabine, Ulrike, Johanna"), s: sp("Hoffmann, Krüger, Vogel, Schreiber, Wagner, Keller, Lehmann, Fischer, Bauer, Richter, Wolf, Neumann") },
  italian: { m: sp("Lorenzo, Marco, Paolo, Matteo, Davide, Stefano, Enrico, Riccardo"), f: sp("Giulia, Chiara, Francesca, Alessia, Elisa, Martina, Serena, Bianca"), s: sp("Rossi, Bianchi, Ferraro, Esposito, Romano, Conti, Marchetti, Galli, Moretti, Barbieri, Lombardi, Greco") },
};
const DIASPORA = ["eastasian", "southasian", "african", "slavic", "nordic", "german", "italian"];
// main culture for each region, with a secondary local culture where place names suggest one
const REGION = {
  Myrati: ["welsh"], Chasmia: ["french", "anglo"], Ambarino: ["french", "anglo"], Carnapol: ["french"], Pleucadeuc: ["french"],
  Mezata: ["spanish"], Ventura: ["spanish", "anglo"], "Costa Blanca": ["spanish"], Pittston: ["spanish", "anglo"], Oplana: ["spanish", "anglo"],
  Kazana: ["portuguese"], Moeras: ["dutch", "anglo"], Reno: ["anglo", "french"], Kalahooska: ["anglo", "nordic"],
  Ambrosia: ["anglo"], Montiablo: ["anglo", "spanish"], Cambria: ["anglo"],
};

function makeNamer(R, reserved = []) {
  const pick = a => a[Math.floor(R() * a.length)];
  const usedFull = new Set(), sCount = new Map(), regionS = new Set(), regionF = new Set(); let curRegion = "";
  const banned = new Set(reserved.flatMap(n => n.replace(/\b(Jr\.|II|III)\b/g, "").trim().split(/[\s-]+/).slice(1)).filter(w => w.length > 2));
  const sOK = s => !banned.has(s) && !s.split(/[\s-]+/).some(w => banned.has(w)) && (sCount.get(s) || 0) < 2 && !regionS.has(curRegion + "|" + s);
  const surname = c => { for (let k = 0; k < 40; k++) { const s = pick(c.s); if (sOK(s)) return s; } return pick(c.s); };
  function culture(region, u) {
    const [main, second] = REGION[region] || ["anglo"], x = R();
    const dias = 0.05 + 0.13 * u; // cities are more mixed
    if (x < dias) return pick(DIASPORA);
    if (second && x < dias + 0.22) return second;
    if (main !== "anglo" && x < dias + 0.17) return "anglo";
    return main;
  }
  function one(region, u) {
    const key = culture(region, u), c = C[key], g = R() < 0.5 ? "m" : "f";
    let first = pick(c[g]); for (let k = 0; k < 20 && regionF.has(curRegion + "|" + first); k++) first = pick(c[g]);
    let last = surname(c);
    const parts = [last];
    const x = R();
    if (c.double && x < c.double) { // Spanish / Portuguese style two surnames (no hyphen)
      let l2 = surname(c); if (l2 !== last) { last = last + " " + l2; parts.push(l2); }
    } else if (key === "portuguese" && x < 0.4) { const p = pick(c.particles); last = last + " " + p; }
    else if (x < 0.04 && !["eastasian"].includes(key)) { // double-barrelled, two different surnames
      const l2 = surname(R() < 0.6 ? c : C.anglo); if (l2 !== last && !l2.includes(" ") && !last.includes(" ")) { last = last + "-" + l2; parts.push(l2); }
    }
    const y = parts.length > 1 ? 0.5 + R() * 0.5 : R(); // no middle names on double surnames
    let full;
    if (key === "eastasian" || key === "southasian" || key === "african") {
      full = (y < 0.25 ? pick(C.anglo[g]) : first) + " " + last; // some anglicised given names
    } else if (y < 0.11) { // First Middle Last
      let mid = pick(c[g]); if (mid === first) mid = pick(c[g]); full = `${first} ${mid} ${last}`;
    } else if (y < 0.22) { // First M. Last
      full = `${first} ${pick(c[g])[0]}. ${last}`;
    } else if (y < 0.26) { // F. Last
      full = `${first[0]}. ${last}`;
    } else if (y < 0.28) { // F.M. Last
      full = `${first[0]}.${pick(c[g])[0]}. ${last}`;
    } else if (y < 0.33 && c.nick && c.nick[first]) { // nickname
      full = `${c.nick[first]} ${last}`;
    } else full = `${first} ${last}`;
    if (R() < 0.025 && ["anglo", "spanish"].includes(key)) full += R() < 0.6 ? " Jr." : " II";
    return { full, parts, first };
  }
  return function name(region, u = 0.5) {
    curRegion = region;
    for (let k = 0; k < 60; k++) {
      const { full, parts, first } = one(region, u);
      if (usedFull.has(full)) continue;
      usedFull.add(full); parts.forEach(p => { sCount.set(p, (sCount.get(p) || 0) + 1); regionS.add(region + "|" + p); }); regionF.add(region + "|" + first);
      return full;
    }
    throw "name pool exhausted";
  };
}
module.exports = { makeNamer };
