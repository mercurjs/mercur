module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
	extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: [
		'.eslintrc.js',
		'**/.prettier*',
		'**/.version*',
		'**/*.md',
		'**/*.json',
		'**/*.js',
		'**/*.js.map',
		'**/*.d.ts',
		'**/*.d.ts.map',
	],
	overrides: [
		{
			files: ['*'],
			rules: {
				'prefer-rest-params': 'off',
			},
		},
	],
	rules: {
		'prettier/prettier': 'error',
		'@typescript-eslint/ban-types': [
			'error',
			{
				types: {
					Function: false,
				},
				extendDefaults: true,
			},
		],
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
	},
};
