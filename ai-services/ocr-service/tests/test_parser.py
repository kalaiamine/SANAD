# -*- coding: utf-8 -*-
"""
Tests unitaires — classification de documents et parsing de dates (OCR).
Lancement :  python -m unittest discover tests -v
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.parser import classify_document, parse_date


class ClassifyDocumentTests(unittest.TestCase):
    def test_carte_identite_tunisienne(self):
        lines = ["الجمهورية التونسية", "بطاقة تعريف وطنية", "وزارة الداخلية"]
        self.assertEqual(classify_document(lines), "identity_card")

    def test_carte_identite_mots_latins(self):
        lines = ["Republique Tunisienne", "Carte Nationale d'Identite"]
        self.assertEqual(classify_document(lines), "identity_card")

    def test_facture_de_reparation(self):
        lines = ["GARAGE AUTO EXPRESS", "Facture N 2026-101", "Total TTC : 850 TND", "TVA 19%"]
        self.assertEqual(classify_document(lines), "invoice")

    def test_document_inconnu(self):
        lines = ["bonjour", "ceci est un texte quelconque"]
        self.assertEqual(classify_document(lines), "unknown")

    def test_texte_vide(self):
        self.assertEqual(classify_document([]), "unknown")


class ParseDateTests(unittest.TestCase):
    def test_format_jour_mois_annee(self):
        self.assertEqual(parse_date("24/10/2002"), "2002-10-24")
        self.assertEqual(parse_date("24-10-2002"), "2002-10-24")
        self.assertEqual(parse_date("24.10.2002"), "2002-10-24")

    def test_format_iso(self):
        self.assertEqual(parse_date("2002-10-24"), "2002-10-24")

    def test_date_invalide(self):
        self.assertIsNone(parse_date("pas une date"))
        self.assertIsNone(parse_date("99/99/9999"))


if __name__ == "__main__":
    unittest.main()
