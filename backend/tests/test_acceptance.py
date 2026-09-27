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

    def test_system_filter_is_exclusive(self):
        response = self.client.get('/api/acceptance/execute?system=gunrock&delay=0')
        self.assertEqual(response.text.count('event: result'), 1)
        self.assertNotIn('"system": "hsgraph"', response.text)
        self.assertNotIn('"speedup"', response.text)
        self.assertNotIn('"system": "tigr"', response.text)

    def test_invalid_or_missing_evidence(self):
        for query in ['algorithm=pagerank', 'dataset=../../secret', 'delay=-1', 'delay=nan',
                      'algorithm=sssp&system=gunrock', 'category=resource&dataset=twitter']:
            with self.subTest(query=query):
                self.assertEqual(self.client.get('/api/acceptance/execute?' + query).status_code, 422)

    def test_preprocessing_demo(self):
        options = self.client.get('/api/preprocessing/catalog').json()
        self.assertEqual(options['mode'], 'demo')
        query = 'dataset=twitter&system=hsgraph&target_format=csr&delay=0'
        response = self.client.get('/api/preprocessing/execute?' + query)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.text.count('event: progress'), 5)
        self.assertIn('"fileGenerated": false', response.text)
        self.assertTrue(response.text.rstrip().endswith('{"completed": 5}'))
        self.assertEqual(self.client.get('/api/preprocessing/execute?' + query.replace('system=hsgraph', 'system=unknown')).status_code, 422)

    def test_system_formats_are_fixed_and_previewed(self):
        options = self.client.get('/api/preprocessing/catalog').json()
        for system, target in options['systemFormats'].items():
            query = f'dataset=twitter&system={system}&delay=0'
            response = self.client.get('/api/preprocessing/execute?' + query)
            self.assertEqual(response.status_code, 200)
            self.assertIn(f'"targetFormat": "{target}"', response.text)
            self.assertIn('"isSample": true', response.text)
            self.assertIn('"fields":', response.text)
            self.assertEqual(self.client.get('/api/preprocessing/execute?' + query + '&source_format=invalid').status_code, 422)
            wrong = 'csr' if target != 'csr' else 'matrix-market'
            self.assertEqual(self.client.get('/api/preprocessing/execute?' + query + '&target_format=' + wrong).status_code, 422)


if __name__ == '__main__':
    unittest.main()
