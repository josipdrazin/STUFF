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
	valid_functions["hash"] =  1
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
	valid_functions["typeof"] =   1

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

function native_for(args) {
	split(args[1],cond,";")
	start=cond[1]
	stop=cond[2]
	step=cond[3] ? cond[3] : 1
	for (i = start; i <= stop; i+=step) {
		print i
	}
}

function native_hex(x,    sign) {
	sign = (native_abs(x) != int(x)) ? "-" : ""
	return "'" sign "0x" zpad(sprintf("%x", native_abs(x)), 2) "'"
}

function native_int(x) {
	return int(x)
}

function native_len(x) {
	return length(x)
}

function native_max(args) {
	total = args[1]
	for (i in args) {
		if (total < args[i]) {
			total = args[i]
		}
	}
	return total
}

function native_min(args) {
	total = args[1]
	for (i in args) {
		if (total > args[i]) {

			total = args[i]
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

function dispatch(func_name, args) {
	if (func_name == "abs")   return native_abs(args[1])
	if (func_name == "all")   return native_all(args)
	if (func_name == "any")   return native_any(args)
	if (func_name == "bin")   return native_bin(args[1])
	if (func_name == "bool")  return (args[1] != "" && args[1] != 0) ? 1 : 0
	if (func_name == "chr")   return native_chr(args[1])
	if (func_name == "float") return args[1] + 0.0
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

function eval_expr(expr,    fn, raw_args, parts, args, n, i, res, prefix, suffix) {
	# Loop while there is an innermost call: name(args_without_parens)
	while (match(expr, /[a-zA-Z_][a-zA-Z0-9_]*\([^()]*\)/)) {
		call_str = substr(expr, RSTART, RLENGTH)
		prefix   = substr(expr, 1, RSTART - 1)
		suffix   = substr(expr, RSTART + RLENGTH)

		# Extract function name and inner argument string
		open_idx = index(call_str, "(")
		fn   = substr(call_str, 1, open_idx - 1)
		raw_args = substr(call_str, open_idx + 1, length(call_str) - open_idx - 1)

		if (!(fn in valid_functions)) {
			return "Error: Unknown function '" fn "'"
		}

		# Split inner arguments by comma and clean them
		# TODO: omit ord from unquoting for error expressions, 
		# ord("c") => error, ord('c') => good 
		delete args
		if (substr(raw_args, 0, 1) != "{" and substr(raw_args, length(raw_args)-2, length(raw_args)-1) != "}") {
			n = split(raw_args, parts, ",")
			for (i = 1; i <= n; i++) {
				args[i] = unquote(parts[i])
			}
	# Execute the innermost function and splice its result back into expr
			res  = dispatch(fn, args)
			expr = prefix res suffix
		}
	}
	return expr
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
