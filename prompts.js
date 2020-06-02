module.exports.prompts = function () {
  return {
    properties: {
      appName: {
        description: 'Enter your AWS app name',
        pattern: /^[a-zA-Z\-]+$/,
        message: 'App name must be only letters and dashes',
        required: true
      },
      stage: {
        description: 'Enter a stage e.g. dev, stg, prd (default is dev)',
      },
      region: {
        description: 'Enter region (default: us-east-1)',
        default: 'us-east-1'
      },
      awsAccessKeyId: {
        description: 'Provide your AWS Access Key ID',
        pattern: /^[A-Z0-9]+$/,
        message: 'Invalid AWS Access Key ID',
        required: true
      },
      awsSecretKey: {
        description: 'Provide your AWS Secret Key',
        pattern: /^[a-zA-Z0-9\+\/\=]+$/,
        message: 'Invalid AWS Secret Key',
        required: true
      },
      branchKey: {
        description: 'Provide your Branch Key',
        pattern: /[key_^a-zA-Z0-9\-]+$/,
        message: 'Invalid. Branch key can be found at: https://branch.dashboard.branch.io/account-settings',
        required: true
      },
      branchSecret: {
        description: 'Provide your Branch Secret',
        pattern: /[secret_^a-zA-Z0-9\_]+$/,
        message: 'Invalid. Branch secret can be found at: https://branch.dashboard.branch.io/account-settings',
        required: true
      },
    }
  }
}