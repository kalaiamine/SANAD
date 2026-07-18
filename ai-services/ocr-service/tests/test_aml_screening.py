# -*- coding: utf-8 -*-
"""
Tests unitaires — moteur de scoring AML/CFT (Loi n° 2015-26).
Lancement :  python -m unittest discover tests -v
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import aml_screening


FAKE_DATASET = {
    "sanctions": [
        {"name_latin": "Abou Test Terroriste", "name_ar": "أبو تجربة", "source": "ONU", "reason": "Test", "type": "sanction"},
    ],
    "pep": [
        {"name_latin": "Habib Politicien", "name_ar": "حبيب سياسي", "position": "Ministre (test)", "type": "pep"},
    ],
    "high_risk_regions": ["ZoneTest"],
}


class AMLScreeningTests(unittest.TestCase):
    def setUp(self):
        # Injecte un jeu de données déterministe à la place du fichier JSON
        self._saved_cache = aml_screening._data_cache
        aml_screening._data_cache = FAKE_DATASET

    def tearDown(self):
        aml_screening._data_cache = self._saved_cache

    def test_identite_propre_donne_risque_low(self):
        res = aml_screening.screen_identity(
            name_latin="Ahmed Ben Salah", birth_date="1990-03-15", birth_place="Sfax"
        )
        self.assertEqual(res["risk_level"], "LOW")
        self.assertEqual(res["risk_score"], 0)
        self.assertEqual(res["sanctions_hits"], [])
        self.assertEqual(res["pep_hits"], [])
        self.assertEqual(res["factors"][0]["factor"], "CLEAN")

    def test_correspondance_sanctions_exacte_donne_risque_high(self):
        res = aml_screening.screen_identity(name_latin="Abou Test Terroriste")
        self.assertGreaterEqual(len(res["sanctions_hits"]), 1)
        self.assertEqual(res["risk_score"], 50)  # correspondance >= 90%
        self.assertEqual(res["risk_level"], "HIGH")

    def test_correspondance_pep_donne_risque_medium(self):
        res = aml_screening.screen_identity(name_latin="Habib Politicien")
        self.assertGreaterEqual(len(res["pep_hits"]), 1)
        self.assertEqual(res["risk_score"], 30)
        self.assertEqual(res["risk_level"], "MEDIUM")

    def test_sanctions_et_pep_cumules_donnent_critical(self):
        # Nom présent (quasi identique) dans les deux listes -> 50 + 30 >= 60
        aml_screening._data_cache = {
            "sanctions": [{"name_latin": "Double Menace", "type": "sanction"}],
            "pep": [{"name_latin": "Double Menace", "type": "pep"}],
            "high_risk_regions": [],
        }
        res = aml_screening.screen_identity(name_latin="Double Menace")
        self.assertEqual(res["risk_level"], "CRITICAL")
        self.assertGreaterEqual(res["risk_score"], 60)

    def test_titulaire_mineur_ajoute_facteur(self):
        res = aml_screening.screen_identity(name_latin="Jeune Client", birth_date="2015-01-01")
        facteurs = [f["factor"] for f in res["factors"]]
        self.assertIn("UNDERAGE", facteurs)
        self.assertEqual(res["risk_score"], 15)

    def test_region_a_risque_ajoute_facteur(self):
        res = aml_screening.screen_identity(name_latin="Client Region", birth_place="ZoneTest")
        facteurs = [f["factor"] for f in res["factors"]]
        self.assertIn("HIGH_RISK_REGION", facteurs)

    def test_base_legale_presente(self):
        res = aml_screening.screen_identity(name_latin="Quelqu'un")
        self.assertIn("2015-26", res["legal_basis"])

    def test_fuzzy_match_orthographe_proche(self):
        # Une variation d'orthographe doit quand même matcher (seuil 0.78)
        res = aml_screening.screen_identity(name_latin="Abou Test Terorriste")
        self.assertGreaterEqual(len(res["sanctions_hits"]), 1)


if __name__ == "__main__":
    unittest.main()
