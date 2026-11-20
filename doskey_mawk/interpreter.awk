# 1. Initialize the global ASCII table once when AWK starts
BEGIN {
	# Core Library Registration (Value = Expected Number of Arguments)
	valid_functions["abs"] =   1
	valid_functions["all"] =   1
	valid_functions["any"] =   1
	valid_functions["bin"] =   1
	valid_functions["bool"] =  1
	valid_functions["chr"] =   1
	valid_functions["float"] = 1
	valid_functions["for"] =   1
	valid_functions["hex"] =   1
	valid_functions["int"] =   1
	valid_functions["len"] =   1
	valid_functions["max"] =   1
	valid_functions["min"] =   1
	valid_functions["oct"] =   1
	valid_functions["ord"] =   1
	valid_functions["pow"] =   1
	valid_functions["round"] = 1
	valid_functions["str"] =   1
	valid_functions["sum"] =   1
	valid_functions["echo"] = 1

	for (i = 1; i <= 255; i++) {
		char = sprintf("%c", i)
		_ord_[char] = i
		_chr_[i] = char
	}
}

# 2. Implement stuff

function native_abs(n) { return (n < 0) ? -n : n }

function native_all(arr, k) { for (k in arr) { if (!arr[k]) return 0 } return 1 }

function native_any(arr, k) { for (k in arr) { if (arr[k]) return 1 } return 0 }

function native_bin(x,    r, n, sign) {
	sign = (x < 0) ? "-" : ""
	n = int(native_abs(x))
	r = ""
	while (n > 0) {
		r = int(n % 2) r
		n = int(n / 2)
	}
	return "'" sign "0b" zpad(r, 8) "'"
}

function native_bool(x) {
	if (x == 0) { return 0 }
	else if (x > 0) { return 1 }
	else { return length(x) > 0 }
	return 0
}

function native_chr(n) { return "'" _chr_[n] "'" }

function native_float(x) {
	return x + 0.0
}
# ADDED FOR (START;STOP;[STEP],[DO STUFF],[DO STUFF],,,,,)
# DEFAULT LOOP VARIABLE IS UNDERSCORE '_' 
# _ for(65;255,echo(_,chr(_),hex(_)))
# 65 A 0x41
# 66 B 0x42
# 67 C 0x43
# 68 D 0x44
# . . .
function native_for(args,    cond, assign, var_name, start, stop, step, i, body, out, res) {
    split(args[1], cond, ";")
    
    # Support optional variable name: for(x=1;5, ...) or default to "i"
    if (cond[1] ~ /=/) {
        split(cond[1], assign, "=")
        var_name = assign[1]
        start    = eval_expr(assign[2]) + 0
    } else {
        var_name = "_"
        start    = eval_expr(cond[1]) + 0
    }
    
    stop = eval_expr(cond[2]) + 0
    step = cond[3] ? (eval_expr(cond[3]) + 0) : 1
    body = args[2]

    # Strip optional { ... } wrapper around the body
    gsub(/^[ \t]*\{|\}[ \t]*$/, "", body)

    out = ""
    for (_ = start; (step > 0 ? _ <= stop : _ >= stop); _ += step) {
        VARS[var_name] = _
        if (body != "") {
            res = eval_expr(body)
            if (res != "") out = (out == "" ? res : out "\n" res)
        } else {
            out = (out == "" ? i : out "\n" i)
        }
    }
    delete VARS[var_name] # Clean up loop variable when done
    return out
}


function native_hex(x,    sign) {
	sign = (native_abs(x) != int(x)) ? "-" : ""
	return "'" sign "0x" zpad(sprintf("%x", native_abs(x)), 2) "'"
}

function native_int(x) {
	return int(unquote(x))
}

function native_len(x) {
	return length(unquote(x))
}

function native_max(args,    i, total) {
	total = unquote(args[1])
	for (i in args) {
		if (total < unquote(args[i])) {
			total = unquote(args[i])
		}
	}
	return total
}

function native_min(args,    i, total) {
	total = unquote(args[1])
	for (i in args) {
		if (total > unquote(args[i])) {
			total = unquote(args[i])
		}
	}
	return total
}

function native_oct(x,    sign) {
	sign = (native_abs(x) != int(x)) ? "-" : ""
	return "'" sign "0o" zpad(sprintf("%o", native_abs(x)), 3) "'"
}

function native_ord(c) { return (c == "") ? 0 : _ord_[substr(c, 1, 1)] }

function native_pow(base, exponent) {
	return base ^ exponent
}

function native_echo(args,    i, total) {
	total = ""
	for (i = 1; i in args; i++) {
		if (args[i] ~ /^'.*'$/) {
			total = total " " unquote(args[i])
		} else {
			total = total " " args[i]
		}
	}
	return total
}

function native_round(x) {
    if (x >= 0) {
        if (x + 0.5 >= int(x) + 1) {
            return int(x) + 1.0;
        } else {
            return int(x) + 0.0;
        }
    } else {
        if (x - 0.5 <= int(x) - 1) {
            return int(x) - 1.0;
        } else {
            return int(x) + 0.0;
        }
    }
}

function native_sum(args,    i, total) {
	total = 0
	for (i in args) {
		total += args[i]
	}
	return total
}

function zpad(str, width,    pre) {
    if (length(str) < width) {
        pre = sprintf("%*s", width - length(str), "")
        gsub(".", "0", pre)
        return pre str
    }
    return str
}

function get_type(raw,    first, last) {
    # Trim leading/trailing spaces (using your existing unquote logic or simple loop)
    first = substr(raw, 1, 1)
    last  = substr(raw, length(raw), 1)

    # 1. Single quotes -> 'char' (or 'str' if longer than 1 character!)
    if (first == "'" && last == "'") {
        if (length(raw) == 3) return "char"   # e.g., 'c' has length 3
        return "str"
    }

    # 2. Double quotes -> "str"
    if (first == "\"" && last == "\"") {
        return "str"
    }

    # 3. Numbers -> check if adding 0 equals the original string
    if (raw != "" && (raw + 0) "" == raw) {
        if (index(raw, ".") > 0) return "float"
        return "int"
    }

    return "unknown"
}

function dispatch(func_name, args) {
	if (func_name == "abs")   return native_abs(args[1])
	if (func_name == "all")   return native_all(args)
	if (func_name == "any")   return native_any(args)
	if (func_name == "bin")   return native_bin(args[1])
	if (func_name == "bool")  return (args[1] != "" && args[1] != 0) ? 1 : 0
	if (func_name == "chr")   return native_chr(args[1])
	if (func_name == "float") return args[1] + 0.0
	if (func_name == "echo")   return native_echo(args)
	if (func_name == "for")   return native_for(args)
	if (func_name == "hex")   return native_hex(args[1])
	if (func_name == "int")   return int(args[1])
	if (func_name == "len")   return native_len(args[1])
	if (func_name == "min")   return native_min(args)
	if (func_name == "max")   return native_max(args)
	if (func_name == "ord")   return native_ord(args[1])
	if (func_name == "oct")   return native_oct(args[1])
	if (func_name == "pow")   return native_pow(args[1], args[2])
	if (func_name == "round") return native_round(args[1])
	if (func_name == "sum")   return native_sum(args)
	if (func_name == "str")   return args[1] ""

    
    return "ERR: Function defined in table, but missing in dispatcher."
}

function eval_expr(expr,    fn, raw_args, parts, args, n, i, res, prefix, suffix, open_idx, call_str) {
    gsub(/^[ \t]+|[ \t]+$/, "", expr)

    # 1. Variable substitution: if expr is a known loop variable (like "i"), return its value
    if (expr in VARS) {
        return VARS[expr]
    }

    # 2. LAZY HANDLING FOR CONTROL FLOW (Top-down, outside-in)
    if (match(expr, /^for\(/)) {
        raw_args = substr(expr, 5, length(expr) - 5) # Strip "for(" and trailing ")"
        n = split_top_level(raw_args, parts, ",")
        for (i = 1; i <= n; i++) {
            args[i] = unquote(parts[i])
        }
        return native_for(args)
    }

    # 3. EAGER HANDLING FOR NORMAL FUNCTIONS (Bottom-up, inside-out)
    while (match(expr, /[a-zA-Z_][a-zA-Z0-9_]*\([^()]*\)/)) {
        call_str = substr(expr, RSTART, RLENGTH)
        prefix   = substr(expr, 1, RSTART - 1)
        suffix   = substr(expr, RSTART + RLENGTH)

        open_idx = index(call_str, "(")
        fn       = substr(call_str, 1, open_idx - 1)
        raw_args = substr(call_str, open_idx + 1, length(call_str) - open_idx - 1)

        if (!(fn in valid_functions)) {
            return "Error: Unknown function '" fn "'"
        }

        delete args
        n = split(raw_args, parts, ",")
        for (i = 1; i <= n; i++) {
            # Resolve variables inside arguments (e.g., echo(i) -> i becomes 1)
            val = unquote(parts[i])
            args[i] = (val in VARS) ? VARS[val] : val
        }

        res  = dispatch(fn, args)
        expr = prefix res suffix
    }
    return expr
}

function split_top_level(str, out_arr, sep,    i, ch, depth, count, buf) {
    delete out_arr
    depth = 0; count = 1; buf = ""
    for (i = 1; i <= length(str); i++) {
        ch = substr(str, i, 1)
        if (ch == "(" || ch == "{") depth++
        else if (ch == ")" || ch == "}") depth--

        if (ch == sep && depth == 0) {
            out_arr[count++] = buf
            buf = ""
        } else {
            buf = buf ch
        }
    }
    out_arr[count] = buf
    return count
}


function unquote(str) {
	gsub(/^[ \t]+|[ \t]+$/, "", str)
	if (str ~ /^".*"$/ || str ~ /^'.*'$/) {
		return substr(str, 2, length(str) - 2)
	}
	return str
}

# 1. Load definitions from the file first
NR == FNR {
	split($0, parts, "=")
		if (parts[1] != "") {
		defs[parts[1]] = parts[2]
	}
	next
}

# 2. Process the live function call from DOSKEY
{
	gsub(/^[ \t]+|[ \t]+$/, "", $0)
	if ($0 == "") next

	# Step 1: Evaluate all nested built-ins (e.g., max(2,1) -> 2, then min(5,2) -> 2)
	resolved = eval_expr($0)
	# Step 2: Check if a custom CMD definition remains (e.g., myf(hello, 2))
	if (match(resolved, /^[a-zA-Z_][a-zA-Z0-9_]*\([^()]*\)$/)) {
		open_idx = index(resolved, "(")
		fn       = substr(resolved, 1, open_idx - 1)
		raw_args = substr(resolved, open_idx + 1, length(resolved) - open_idx - 1)

		if (fn in defs) {
			split(raw_args, parts, ",")
			arg1 = unquote(parts[1])
			arg2 = unquote(parts[2])

			cmd = defs[fn]
			gsub(/\$A1/, arg1, cmd)
			gsub(/\$A2/, arg2, cmd)
			system(cmd)
		} else {
			print "Error: Function '" fn "' is undefined."
		}
	} else {
	# Step 3: Otherwise, print the final evaluated value
		print resolved
	}
}
