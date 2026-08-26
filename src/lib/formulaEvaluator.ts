// ---- Formula evaluator -------------------------------------------------------------------------
// A faithful port of app/Support/FormulaEvaluator.php, kept deliberately in step with it:
// same grammar, same error wording. Used only for the local preview — the server still
// validates on save and evaluates at earn time.

type Token = { type: 'operator' | 'paren' | 'number' | 'name'; value: string };

const FUNCTIONS = ['floor'];

const isDigit = (c: string) => c >= '0' && c <= '9';
const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
const isAlnum = (c: string) => isAlpha(c) || isDigit(c);
// Matches PHP is_numeric() closely enough for the number shapes the tokenizer can build.
const isNumeric = (s: string) => /^(\d+(\.\d*)?|\.\d+)$/.test(s);

function tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;

    while (index < formula.length) {
        const character = formula[index];

        if (/\s/.test(character)) { index++; continue; }

        if ('+-*/()'.includes(character)) {
            tokens.push({ type: character === '(' || character === ')' ? 'paren' : 'operator', value: character });
            index++;
            continue;
        }

        if (isDigit(character) || character === '.') {
            let number = '';
            while (index < formula.length && (isDigit(formula[index]) || formula[index] === '.')) {
                number += formula[index];
                index++;
            }
            if (!isNumeric(number)) throw new Error(`Invalid number "${number}" in formula.`);
            tokens.push({ type: 'number', value: number });
            continue;
        }

        if (isAlpha(character) || character === '_') {
            let name = '';
            while (index < formula.length && (isAlnum(formula[index]) || formula[index] === '_')) {
                name += formula[index];
                index++;
            }
            tokens.push({ type: 'name', value: name });
            continue;
        }

        throw new Error(`Unexpected character "${character}" in formula.`);
    }

    return tokens;
}

export function evaluate(formula: string, variables: Record<string, number> = {}): number {
    const tokens = tokenize(formula);
    const vars: Record<string, number> = {};
    Object.entries(variables).forEach(([name, value]) => { vars[name] = Number(value); });

    let position = 0;

    const currentOperator = () => {
        const token = tokens[position];
        return token && token.type === 'operator' ? token.value : null;
    };

    const expectClosingParen = () => {
        const token = tokens[position];
        if (!token || token.value !== ')') throw new Error('Missing ")" in formula.');
        position++;
    };

    function parseExpression(): number {
        let value = parseTerm();
        let operator;
        while ((operator = currentOperator()) !== null && (operator === '+' || operator === '-')) {
            position++;
            const right = parseTerm();
            value = operator === '+' ? value + right : value - right;
        }
        return value;
    }

    function parseTerm(): number {
        let value = parseFactor();
        let operator;
        while ((operator = currentOperator()) !== null && (operator === '*' || operator === '/')) {
            position++;
            const right = parseFactor();
            if (operator === '/') {
                if (right === 0) throw new Error('Division by zero in formula.');
                value /= right;
                continue;
            }
            value *= right;
        }
        return value;
    }

    function parseFactor(): number {
        if (currentOperator() === '-') { position++; return -parseFactor(); }
        if (currentOperator() === '+') { position++; return parseFactor(); }
        return parsePrimary();
    }

    function parsePrimary(): number {
        const token = tokens[position];
        if (!token) throw new Error('Formula ended unexpectedly.');

        if (token.type === 'number') { position++; return Number(token.value); }

        if (token.type === 'paren' && token.value === '(') {
            position++;
            const value = parseExpression();
            expectClosingParen();
            return value;
        }

        if (token.type === 'name') {
            position++;
            if (FUNCTIONS.includes(token.value)) return parseFunctionCall(token.value);
            if (!Object.prototype.hasOwnProperty.call(vars, token.value)) {
                throw new Error(`Unknown variable "${token.value}" in formula.`);
            }
            return vars[token.value];
        }

        throw new Error(`Unexpected "${token.value}" in formula.`);
    }

    function parseFunctionCall(name: string): number {
        const token = tokens[position];
        if (!token || token.value !== '(') throw new Error(`Expected "(" after ${name}() in formula.`);
        position++;
        const argument = parseExpression();
        expectClosingParen();
        return Math.floor(argument);
    }

    const result = parseExpression();

    if (position < tokens.length) throw new Error(`Unexpected "${tokens[position].value}" in formula.`);

    return result;
}

export function identifiers(formula: string): string[] {
    const names = tokenize(formula)
        .filter((token) => token.type === 'name' && !FUNCTIONS.includes(token.value))
        .map((token) => token.value);

    return [...new Set(names)];
}
