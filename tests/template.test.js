const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Custom schema to handle CloudFormation tags like !Ref, !GetAtt, !Sub
const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: data => ({ Ref: data }) }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: data => ({ 'Fn::GetAtt': data.split('.') }) }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: data => ({ 'Fn::Sub': data }) }),
]);

const templatePath = path.join(__dirname, '..', 'infra', 'stack.yaml');
const template = yaml.load(fs.readFileSync(templatePath, 'utf8'), { schema: cfnSchema });

describe('CloudFormation Template', () => {
  test('has AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('has S3 bucket resource', () => {
    expect(template.Resources.RocS3Bucket).toBeDefined();
    expect(template.Resources.RocS3Bucket.Type).toBe('AWS::S3::Bucket');
  });

  test('bucket blocks all public access', () => {
    const props = template.Resources.RocS3Bucket.Properties;
    const publicBlock = props.PublicAccessBlockConfiguration;
    expect(publicBlock.BlockPublicAcls).toBe(true);
    expect(publicBlock.BlockPublicPolicy).toBe(true);
    expect(publicBlock.IgnorePublicAcls).toBe(true);
    expect(publicBlock.RestrictPublicBuckets).toBe(true);
  });

  test('bucket name uses environment prefix and account ID', () => {
    const props = template.Resources.RocS3Bucket.Properties;
    expect(props.BucketName['Fn::Sub']).toBe('${Environment}-s3-roc-s3first-cloudformation-${AWS::AccountId}');
  });

  test('has Environment parameter', () => {
    expect(template.Parameters.Environment).toBeDefined();
    expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'stage', 'uat', 'prod']);
  });
});
