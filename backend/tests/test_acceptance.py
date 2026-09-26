import unittest
from fastapi.testclient import TestClient
from backend.app.main import app


class AcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_catalog_report_values(self):
        data = self.client.get('/api/acceptance/catalog').json()
        self.assertEqual(len(data['cases']), 9)
        performance = [c for c in data['cases'] if c['category'] == 'performance']
        self.assertEqual([r['speedup'] for c in performance for r in c['rows'] if r['system'] != 'hsgraph'],
                         [14.6, 3.9, 12.1, 3.6, 4.3, 8, 2.1])
        self.assertEqual(data['requirements'][2]['status'], '待补充')

    def test_stream_order_and_results(self):
        response = self.client.get('/api/acceptance/execute?delay=0')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.text.count('event: result'), 9)
        self.assertEqual(response.text.count('event: done'), 1)
        self.assertLess(response.text.index('event: log'), response.text.index('event: result'))
        self.assertTrue(response.headers['content-type'].startswith('text/event-stream'))

    def test_system_filter_keeps_subject(self):
        response = self.client.get('/api/acceptance/execute?system=gunrock&delay=0')
        self.assertEqual(response.text.count('event: result'), 1)
        self.assertIn('"system": "hsgraph"', response.text)
        self.assertNotIn('"system": "tigr"', response.text)

    def test_invalid_or_missing_evidence(self):
        for query in ['algorithm=pagerank', 'dataset=../../secret', 'delay=-1', 'delay=nan',
                      'algorithm=sssp&system=gunrock', 'category=resource&dataset=twitter']:
            with self.subTest(query=query):
                self.assertEqual(self.client.get('/api/acceptance/execute?' + query).status_code, 422)


if __name__ == '__main__':
    unittest.main()
