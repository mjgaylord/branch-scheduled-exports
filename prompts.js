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
      branchAppId: {
        description: 'Provide your Branch App ID. This can be found on the Account Settings > Profile page of the Branch dashboard'
      },
      branchAccessToken: {
        description: 'Provide your Branch Access Token (required if you are using Custom Export API) See Account Settings > User on the Branch dashboard for your token'
      },
      reportTypes: {
        description: 'Provide the report types you would like download (required if you are using Custom Export API, ignored for Daily Export API). For a list of available reports see: https://help.branch.io/developers-hub/docs/custom-exports#section-branch-available-topics'
      },
      branchKey: {
        description: 'Provide your Branch Key (required if you are using Daily Export API)',
      },
      branchSecret: {
        description: 'Provide your Branch Secret (required if you are using Daily Export API)',
      },
    }
  }
}