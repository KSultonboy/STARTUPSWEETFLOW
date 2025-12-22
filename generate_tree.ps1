param(
    [string]$Root = ".",
    [string[]]$ExcludeNames = @(
        "node_modules",
        ".git",
        ".expo",
        ".turbo",
        ".next",
        "dist",
        "build",
        ".idea",
        ".vscode",
        "coverage",
        ".cache"
    )
)

function Write-Tree {
    param(
        [string]$Path,
        [string]$Prefix
    )

    $dirs = Get-ChildItem -LiteralPath $Path -Directory | Where-Object { $ExcludeNames -notcontains $_.Name }
    $files = Get-ChildItem -LiteralPath $Path -File

    $items = @()
    $items += $dirs
    $items += $files

    for ($i = 0; $i -lt $items.Count; $i++) {
        $item = $items[$i]
        $isLast = $i -eq ($items.Count - 1)
        $connector = if ($isLast) { "\--" } else { "+--" }

        Write-Output ("{0}{1} {2}" -f $Prefix, $connector, $item.Name)

        if ($item.PSIsContainer) {
            $newPrefix = if ($isLast) { "$Prefix    " } else { "$Prefix|   " }
            Write-Tree -Path $item.FullName -Prefix $newPrefix
        }
    }
}

Write-Output "Project Structure:"

$rootDirs = Get-ChildItem -LiteralPath $Root -Directory | Where-Object { $ExcludeNames -notcontains $_.Name }

for ($i = 0; $i -lt $rootDirs.Count; $i++) {
    $dir = $rootDirs[$i]
    $isLast = $i -eq ($rootDirs.Count - 1)
    $connector = if ($isLast) { "\--" } else { "+--" }

    Write-Output ("{0} {1}" -f $connector, $dir.Name)

    $prefix = if ($isLast) { "    " } else { "|   " }
    Write-Tree -Path $dir.FullName -Prefix $prefix
}

