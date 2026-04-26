Set-Location -Path "$PSScriptRoot/../apps/frontend"
$files = Get-ChildItem -Recurse -Include *.vue,*.ts,*.css -File | Where-Object {
    $_.FullName -notmatch '\\_cbc_backup\\' -and
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\\.nuxt\\' -and
    $_.FullName -notmatch '\\\.output\\' -and
    $_.FullName -notmatch '\\dist\\'
}
$count = 0
foreach ($f in $files) {
    $orig = Get-Content $f.FullName -Raw -Encoding UTF8
    if ($null -eq $orig) { continue }
    $new = $orig
    $new = $new -replace '\bbg-base-translucent\b','bg-page-translucent'
    $new = $new -replace '\bbg-base\b','bg-page'
    $new = $new -replace '\bfrom-base\b','from-page'
    $new = $new -replace '\bto-base\b','to-page'
    $new = $new -replace '\bvia-base\b','via-page'
    $new = $new -replace '\bborder-base-translucent\b','border-page-translucent'
    $new = $new -replace '\bborder-base\b','border-page'
    $new = $new -replace '\bring-base\b','ring-page'
    $new = $new -replace '\boutline-base\b','outline-page'
    $new = $new -replace '\bdivide-base\b','divide-page'
    $new = $new -replace '\baccent-base\b','accent-page'
    $new = $new -replace '\bcaret-base\b','caret-page'
    $new = $new -replace '\bplaceholder-base\b','placeholder-page'
    $new = $new -replace '\bfill-base\b','fill-page'
    $new = $new -replace '\bstroke-base\b','stroke-page'
    $new = $new -replace '\bshadow-base\b','shadow-page'
    if ($new -ne $orig) {
        Set-Content -Path $f.FullName -Value $new -Encoding UTF8 -NoNewline
        $count++
        $rel = $f.FullName.Substring((Get-Location).Path.Length + 1)
        Write-Host "Updated: $rel"
    }
}
Write-Host "Total files modified: $count"
