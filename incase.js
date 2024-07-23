function extIeee754() {
    'use strict';

    var converter = this;

    function normalize(number) {
        return number
            .replace(/ /g, '')
            .replace(',', '.')
            .replace(/nan/i, 'NaN')
            .replace(/∞|infinity/i, 'Infinity')  // Convert "infinity" to "Infinity"
            .replace(/-∞|-infinity/i, '-Infinity');  // Convert "-infinity" to "-Infinity"
    }

    function parseToView(digitsPerByte, fromBase, number) {
        if (/^0[bx]/i.test(number)) {
            number = number.substr(2);
        }

        var arr = new Uint8Array(number.length / digitsPerByte);

        for (var i = 0; i < arr.length; i++) {
            arr[i] = parseInt(
                number.substr(i * digitsPerByte, digitsPerByte),
                fromBase
            );
        }

        return new DataView(arr.buffer);
    }

    function numberToArr32(number) {
        var arr = new Uint8Array(4);
        var view = new DataView(arr.buffer);
        view.setFloat32(0, +number);
        return arr;
    }

    function numberToArr64(number) {
        var arr = new Uint8Array(8);
        var view = new DataView(arr.buffer);
        view.setFloat64(0, +number);
        return arr;
    }

    function arrToBase(toBase, arr) {
        var result = '';
        for (var i = 0; i < arr.length; i++) {
            result += (256 + arr[i]).toString(toBase).substr(1).toUpperCase();
        }

        return result;
    }

    function getExactDec(number) {
        return (
            number === 0 && 1 / number < 0
                ? '-0'
                : new converter.Big(
                    number.toString(16),
                    16
                ).toString(10)
        );
    }

    function valid(base, number) {
        if (number === undefined) {
            return base === 'dec' || /^(dec|bin|hex)(32|64)$/.test(base);
        }
    
        number = normalize(number);
    
        if (number) {
            if (base === 'dec') {
                return number === 'NaN' || number === 'Infinity' || number === '-Infinity' || !isNaN(+number);
            } else if (base === 'bin32') {
                return /^(0b)?[01]{32}$/i.test(number);
            } else if (base === 'hex32') {
                return /^(0x)?[0-9a-f]{8}$/i.test(number);
            }
        }
    
        return false;
    }
    
    return {
        from: function (fromBase, number) {
            number = normalize(number);
    
            if (!valid(fromBase, number)) {
                return;
            }
    
            if (number === 'Infinity') {
                return Infinity;
            } else if (number === '-Infinity') {
                return -Infinity;
            } else if (fromBase === 'dec') {
                return +number;
            } else if (fromBase === 'bin32') {
                return parseToView(8, 2, number).getFloat32(0);
            } else if (fromBase === 'hex32') {
                return parseToView(2, 16, number).getFloat32(0);
            }
        },

        to: function (toBase, number) {
            if (number === Infinity) {
                return 'Infinity';
            } else if (number === -Infinity) {
                return '-Infinity';
            }

            if (toBase === 'dec') {
                return '' + number;
            } else {
                number = +number;

                if (toBase === 'dec32') {
                    return getExactDec(new DataView(numberToArr32(number).buffer).getFloat32(0));
                } else if (toBase === 'dec64') {
                    return getExactDec(number);
                } else if (toBase === 'bin32') {
                    var arr = numberToArr32(number);
                    var view = new DataView(arr.buffer);
                    var sign = view.getUint8(0) & 0x80 ? '1' : '0';
                    var exponent = (view.getUint8(0) & 0x7F) << 1 | (view.getUint8(1) >> 7);
                    var mantissa = (view.getUint8(1) & 0x7F) << 16 | (view.getUint8(2) << 8) | view.getUint8(3);
                    if (exponent === 0 && mantissa !== 0) {
                        // Denormalized number
                        return `${sign} 00000000 ${mantissa.toString(2).padStart(23, '0')}`;
                    }
                    var result = `${sign} ${exponent.toString(2).padStart(8, '0')} ${mantissa.toString(2).padStart(23, '0')}`;
                    return result;
                } else if (toBase === 'bin64') {
                    return arrToBase(2, numberToArr64(number)).replace(/^(.)(.{11})(.+)$/, '$1 $2 $3');
                } else if (toBase === 'hex32') {
                    return arrToBase(16, numberToArr32(number));
                } else if (toBase === 'hex64') {
                    return arrToBase(16, numberToArr64(number));
                }
            }
        },

        valid: valid,

        normalize: function (number) {
            if (number === 0) return '0';
            var exponent = Math.floor(Math.log2(Math.abs(number)));
            var mantissa = (number / Math.pow(2, exponent)).toString(2);
            return `+${mantissa} x 2^${exponent}`;
        }
    };
}
