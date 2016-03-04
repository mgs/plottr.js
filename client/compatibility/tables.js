// This table contains a hash-table with the different possible error codes and their descriptions.
var errorCodeTable = {
    10: `[10] Output instruction received while another output instruction is
              executing. The first instruction is executed while the next
              instruction is ignored.`,
    11: `[11] Invalid byte received after first two characters, ESC., in a
              device control instruction.`,
    12: `[12] Invalid byte received while parsing a device control instruction.
              The parameter containing the invalid byte and all the following
              parameters are defaulted.`,
    13: `[13] Parameter out of range.`,
    14: `[14] Too many parameters received. Additional parameters beyond the
              correct number are ignored.`,
    15: `[15] A framing error, parity error, or overrun error has occurred.`,
    16: `[16] The input buffer has overflowed. This will result in loss of data
              and probably an HPGL error.`,
    17: `[17] Baud rate mismatch.`,
    18: `[18] I/O error indeterminate.`,
    20: `[20] RS232 Serial Tx/Rx Test Failed.`,
    21: `[21] RS232 DTR Test Failed.`
};
