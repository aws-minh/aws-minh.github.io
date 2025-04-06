import os
import json
from datetime import datetime
from qcloud_cos import CosConfig, CosS3Client

class TencentCloudAnalyticsExporter:
    def __init__(self, secret_id, secret_key, region, bucket):
        """
        Initialize Tencent Cloud Storage client
        
        :param secret_id: Tencent Cloud API Secret ID
        :param secret_key: Tencent Cloud API Secret Key
        :param region: Tencent Cloud Storage region
        :param bucket: Target bucket name
        """
        config = CosConfig(
            Region=region, 
            SecretId=secret_id, 
            SecretKey=secret_key
        )
        self.client = CosS3Client(config)
        self.bucket = bucket

    def collect_analytics_data(self, data_path='data/analytics.json'):
        """
        Collect analytics data from local storage or file
        
        :param data_path: Path to analytics data file
        :return: Dictionary of analytics data
        """
        try:
            # Check if file exists
            if os.path.exists(data_path):
                with open(data_path, 'r') as f:
                    return json.load(f)
            
            # Alternatively, collect from environment or default data
            return {
                'total_views': os.environ.get('TOTAL_VIEWS', '0'),
                'timestamp': datetime.now().isoformat(),
                'source': 'github_actions'
            }
        except Exception as e:
            print(f"Error collecting analytics data: {e}")
            return {}

    def export_to_tencent_cloud(self, analytics_data):
        """
        Export analytics data to Tencent Cloud Storage
        
        :param analytics_data: Dictionary of analytics data
        :return: Cloud storage object key
        """
        try:
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            cloud_object_key = f"analytics/portfolio_analytics_{timestamp}.json"

            # Convert data to JSON string
            analytics_json = json.dumps(analytics_data, indent=2)
            
            # Upload to Tencent Cloud Storage
            self.client.put_object(
                Bucket=self.bucket,
                Body=analytics_json.encode('utf-8'),
                Key=cloud_object_key
            )

            print(f"Successfully uploaded analytics to {cloud_object_key}")
            return cloud_object_key

        except Exception as e:
            print(f"Error uploading to Tencent Cloud Storage: {e}")
            raise

def main():
    # Retrieve Tencent Cloud credentials from environment
    secret_id = os.environ.get('TENCENT_SECRET_ID')
    secret_key = os.environ.get('TENCENT_SECRET_KEY')
    region = os.environ.get('TENCENT_REGION', 'ap-shanghai')
    bucket = os.environ.get('TENCENT_BUCKET')

    # Validate credentials
    if not all([secret_id, secret_key, bucket]):
        raise ValueError("Missing Tencent Cloud credentials")

    # Initialize exporter
    exporter = TencentCloudAnalyticsExporter(
        secret_id, 
        secret_key, 
        region, 
        bucket
    )

    # Collect and export analytics
    analytics_data = exporter.collect_analytics_data()
    exporter.export_to_tencent_cloud(analytics_data)

if __name__ == '__main__':
    main()
