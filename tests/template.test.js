const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Custom schema to handle CloudFormation tags like !Ref, !GetAtt, !Sub
const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: data => ({ Ref: data }) }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: data => ({ 'Fn::GetAtt': data.split('.') }) }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: data => ({ 'Fn::Sub': data }) }),
]);

const templatePath = path.join(__dirname, '..', 'template.yaml');
const template = yaml.load(fs.readFileSync(templatePath, 'utf8'), { schema: cfnSchema });

describe('CloudFormation Template', () => {
  test('has AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('has S3 bucket resource', () => {
    expect(template.Resources.RocS3Bucket).toBeDefined();
    expect(template.Resources.RocS3Bucket.Type).toBe('AWS::S3::Bucket');
  });

  test('bucket is private', () => {
    const props = template.Resources.RocS3Bucket.Properties;
    expect(props.AccessControl).toBe('Private');
  });

  test('bucket has correct name', () => {
    const props = template.Resources.RocS3Bucket.Properties;
    expect(props.BucketName).toBe('roc-s3first-cloudformation');
  });
});
