import path from "node:path";
import n from "eslint-plugin-n";
import sonarjs from "eslint-plugin-sonarjs";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import { defineConfig } from "eslint/config";
import noFloatingPromise from "eslint-plugin-no-floating-promise";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig([
	includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
	{
		name: "linter",

		files: ["**/*.{js,mjs}"],

		plugins: {
			n,
			sonarjs,
			"no-floating-promise": noFloatingPromise,
			"@stylistic": stylistic
		},

		languageOptions: {
			globals: {
				...globals.node
			},

			ecmaVersion: "latest",

			parserOptions: {
				ecmaFeatures: {
					impliedStrict: true
				}
			}
		},

		rules: {
			...js.configs.recommended.rules,
			...n.configs["flat/recommended-script"].rules,

			curly: ["error", "all"],
			eqeqeq: ["warn", "always", { null: "ignore" }],

			"no-shadow": ["warn", { allow: ["cb"] }],
			"no-unassigned-vars": ["error"],
			"no-useless-assignment": ["warn"],
			"accessor-pairs": ["error"],
			"default-case-last": ["error"],
			"default-param-last": ["error"],
			"object-shorthand": ["error"],
			"array-callback-return": ["error"],
			"block-scoped-var": ["error"],
			"constructor-super": ["error"],
			"for-direction": ["error"],
			"func-name-matching": ["error"],
			"guard-for-in": ["error"],
			"prefer-rest-params": ["error"],
			"prefer-spread": ["error"],
			"no-console": [0],
			"no-unreachable-loop": ["error"],
			"no-undef": ["error"],
			"grouped-accessor-pairs": ["error", "getBeforeSet"],
			"prefer-numeric-literals": ["error"],
			"prefer-promise-reject-errors": ["error"],
			"no-extra-bind": ["error"],
			"no-implied-eval": ["error"],
			"no-label-var": ["error"],
			"no-labels": ["error"],
			"no-object-constructor": ["error"],
			"no-octal-escape": ["error"],
			"no-proto": ["error"],
			"no-sequences": ["error"],
			"no-useless-call": ["error"],
			"no-useless-catch": ["error"],
			"no-with": ["error"],
			"no-fallthrough": ["error"],
			"no-restricted-syntax": ["error", "BinaryExpression[operator='in']"],
			"no-script-url": ["error"],
			"no-unused-vars": ["error", {
				vars: "all",
				args: "none"
			}],
			"no-array-constructor": ["error"],
			"no-class-assign": ["error"],
			"no-constant-condition": ["error"],
			"no-constant-binary-expression": ["error"],
			"no-constructor-return": ["error"],
			"no-control-regex": ["error"],
			"no-delete-var": ["error"],
			"no-dupe-args": ["error"],
			"no-dupe-keys": ["error"],
			"no-dupe-else-if": ["error"],
			"no-duplicate-imports": ["error"],
			"no-empty": ["error"],
			"no-extra-boolean-cast": ["error"],
			"no-func-assign": ["error"],
			"no-inner-declarations": ["error", "functions", { blockScopedFunctions: "disallow" }],
			"no-invalid-regexp": ["error"],
			"no-irregular-whitespace": ["error"],
			"no-obj-calls": ["error"],
			"no-new-native-nonconstructor": ["error"],
			"no-self-compare": ["error"],
			"no-this-before-super": ["error"],
			"no-prototype-builtins": ["error"],
			"no-return-assign": ["error"],
			"no-setter-return": ["error"],
			"no-useless-computed-key": ["error"],
			"no-useless-concat": ["error"],
			"no-unused-private-class-members": ["error"],
			"no-async-promise-executor": ["error"],
			"no-new-wrappers": ["error"],
			"no-nonoctal-decimal-escape": ["error"],
			"no-regex-spaces": ["error"],
			"no-sparse-arrays": ["error"],
			"no-unexpected-multiline": ["error"],
			"no-unreachable": ["error"],
			"no-unneeded-ternary": ["error"],
			"no-unsafe-optional-chaining": ["error"],
			"no-unsafe-negation": ["error"],
			"no-unused-expressions": ["error", {
				allowShortCircuit: true,
				allowTernary: true
			}],
			"no-else-return": ["error"],
			"no-throw-literal": ["error"],
			"no-template-curly-in-string": ["error"],

			"no-use-before-define": ["error", {
				functions: false
			}],
			"no-useless-escape": ["error"],
			"no-useless-return": ["error"],
			"no-useless-rename": ["error"],
			"no-unmodified-loop-condition": ["error"],
			"no-var": ["error"],
			"one-var": ["error", "never"],
			"prefer-template": ["error"],
			"prefer-const": ["error", {
				destructuring: "all"
			}],
			"prefer-object-has-own": ["error"],
			"use-isnan": ["error"],
			"valid-typeof": ["error"],
			"require-atomic-updates": 0,
			"preserve-caught-error": 0,

			"no-floating-promise/no-floating-promise": ["error"],

			"@stylistic/array-bracket-newline": ["error", "consistent"],
			"@stylistic/array-bracket-spacing": ["error"],
			"@stylistic/array-element-newline": ["error", "consistent"],
			"@stylistic/arrow-spacing": ["error"],
			"@stylistic/block-spacing": ["error"],
			"@stylistic/brace-style": ["error", "1tbs", {
				allowSingleLine: false
			}],
			"@stylistic/comma-spacing": ["error"],
			"@stylistic/comma-dangle": ["error", "never"],
			"@stylistic/computed-property-spacing": ["error"],
			"@stylistic/dot-location": ["error", "property"],
			"@stylistic/function-call-spacing": ["error", "never"],
			"@stylistic/function-paren-newline": ["error"],
			"@stylistic/generator-star-spacing": ["error"],
			"@stylistic/implicit-arrow-linebreak": ["error", "beside"],
			"@stylistic/indent": ["error", "tab", {
				SwitchCase: 1
			}],
			"@stylistic/key-spacing": ["error"],
			"@stylistic/linebreak-style": ["error", "unix"],
			"@stylistic/keyword-spacing": ["error"],
			"@stylistic/no-extra-semi": ["error"],
			"@stylistic/no-mixed-spaces-and-tabs": ["error"],
			"@stylistic/no-multi-spaces": ["error", {
				ignoreEOLComments: true,
				exceptions: {
					ImportDeclaration: true,
					VariableDeclarator: true
				}
			}],
			"@stylistic/no-whitespace-before-property": ["error"],
			"@stylistic/nonblock-statement-body-position": ["error", "below"],
			"@stylistic/object-curly-spacing": ["error", "always"],
			"@stylistic/object-property-newline": ["error", {
				allowAllPropertiesOnSameLine: true
			}],
			"@stylistic/operator-linebreak": ["error", "after"],
			"@stylistic/padded-blocks": ["error", "never"],
			"@stylistic/quote-props": ["error", "as-needed"],
			"@stylistic/quotes": ["error", "double"],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/semi-spacing": ["error"],
			"@stylistic/semi-style": ["error"],
			"@stylistic/space-before-blocks": ["error", "always"],
			"@stylistic/space-before-function-paren": ["error", {
				anonymous: "never",
				named: "never",
				asyncArrow: "never",
				catch: "always"
			}],
			"@stylistic/space-in-parens": ["error", "never"],
			"@stylistic/space-infix-ops": ["error"],
			"@stylistic/space-unary-ops": ["error"],
			"@stylistic/switch-colon-spacing": "error",
			"@stylistic/wrap-regex": ["error"],
			"@stylistic/eol-last": ["error", "always"],
			"@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
			"@stylistic/padding-line-between-statements": [
				"error",
				{ blankLine: "always", prev: "function", next: "function" },
				{ blankLine: "always", prev: "function", next: "*" },
				{ blankLine: "always", prev: "*", next: "function" }
			],
			"@stylistic/no-trailing-spaces": "error",

			"sonarjs/no-all-duplicated-branches": ["error"],
			"sonarjs/no-extra-arguments": ["error"],
			"sonarjs/no-identical-conditions": ["error"],
			"sonarjs/no-identical-expressions": ["error"],
			"sonarjs/no-identical-functions": ["error"],
			"sonarjs/no-use-of-empty-return-value": ["error"],
			"sonarjs/no-redundant-boolean": ["error"],
			"sonarjs/no-inverted-boolean-check": ["error"],
			"sonarjs/no-element-overwrite": ["error"],
			"sonarjs/no-collection-size-mischeck": ["error"],
			"sonarjs/no-same-line-conditional": ["error"],
			"sonarjs/no-unused-collection": ["error"],
			"sonarjs/non-existent-operator": ["error"],
			"sonarjs/no-ignored-return": ["error"],
			"sonarjs/no-gratuitous-expressions": ["error"],
			"sonarjs/no-literal-call": ["error"],
			"sonarjs/no-primitive-wrappers": ["error"],
			"sonarjs/no-redundant-assignments": ["error"],
			"sonarjs/no-redundant-parentheses": ["error"],
			"sonarjs/no-unthrown-error": ["error"],
			"sonarjs/no-empty-collection": ["error"],
			"sonarjs/no-empty-group": ["error"],
			"sonarjs/no-equals-in-for-termination": ["error"],
			"sonarjs/no-for-in-iterable": ["error"],
			"sonarjs/no-globals-shadowing": ["error"],
			"sonarjs/no-hardcoded-secrets": ["error"],
			"sonarjs/no-incorrect-string-concat": ["error"],
			"sonarjs/no-try-promise": ["error"],
			"sonarjs/null-dereference": ["error"],
			"sonarjs/operation-returning-nan": ["error"],
			"sonarjs/anchor-precedence": "error",

			"sonarjs/no-duplicated-branches": ["warn"],
			"sonarjs/no-redundant-jump": ["warn"],
			"sonarjs/no-nested-switch": ["warn"],
			"sonarjs/no-small-switch": ["warn"],
			"sonarjs/no-misleading-array-reverse": ["warn"],
			"sonarjs/no-dead-store": ["warn"],
			"sonarjs/no-nested-conditional": ["warn"],
			"sonarjs/no-nested-template-literals": ["warn"],
			"sonarjs/prefer-single-boolean-return": ["warn"],
			"sonarjs/prefer-while": ["warn"],
			"sonarjs/prefer-immediate-return": ["warn"],

			"n/file-extension-in-import": ["error", "always"],
			"n/no-callback-literal": ["error"],
			"n/no-extraneous-require": [0],
			"n/no-extraneous-import": [0],
			"n/handle-callback-err": ["error"],
			"n/no-missing-require": ["error"],
			"n/no-missing-import": ["error"],
			"n/no-new-require": ["error"],
			"n/no-path-concat": ["warn"],
			"n/no-process-exit": [0],
			"n/no-unpublished-require": [0],
			"n/no-unpublished-import": [0],
			"n/prefer-node-protocol": ["error"],
			"n/prefer-global/buffer": ["error", "always"],
			"n/prefer-global/console": ["error", "always"],
			"n/prefer-global/process": ["error", "always"],
			"n/prefer-global/text-decoder": ["error", "always"],
			"n/prefer-global/text-encoder": ["error", "always"],
			"n/prefer-global/url": ["error", "always"],
			"n/prefer-global/url-search-params": ["error", "always"],
			"n/no-unsupported-features/es-builtins": ["error", {
				version: ">=24.19.0"
			}],
			"n/no-unsupported-features/es-syntax": ["error", {
				version: ">=24.19.0"
			}],
			"n/no-unsupported-features/node-builtins": ["error", {
				version: ">=24.19.0"
			}]
		}
	}
]);
