<?php
/**
 * TARGETED FRONTEND ERROR ANALYSIS
 * Focus on actual critical React/JavaScript errors
 */

echo "🔍 TARGETED FRONTEND ERROR ANALYSIS\n";
echo "===================================\n";
echo "Checking for actual critical frontend errors...\n\n";

class TargetedFrontendChecker {
    private $srcDir = '/Users/conradkaliyaoa/Codes/itsxtrapush/src';
    private $criticalErrors = [];
    private $warnings = [];
    private $recommendations = [];
    
    public function runAnalysis() {
        echo "🚀 PERFORMING TARGETED ANALYSIS\n";
        echo str_repeat("-", 35) . "\n";
        
        // Check 1: Missing required dependencies
        $this->checkMissingDependencies();
        
        // Check 2: Undefined state initialization
        $this->checkUndefinedStates();
        
        // Check 3: Critical error handling gaps
        $this->checkErrorHandling();
        
        // Check 4: Build/runtime errors
        $this->checkBuildIssues();
        
        // Check 5: API integration errors
        $this->checkApiIntegration();
        
        // Generate report
        $this->generateReport();
    }
    
    private function checkMissingDependencies() {
        echo "1. Checking useEffect dependencies...\n";
        
        $files = $this->findFiles(['*.jsx', '*.js', '*.tsx', '*.ts']);
        $pattern = '/useEffect\s*\(\s*\([^)]*\)\s*,\s*\[\s*\]\s*\)/';
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            if (preg_match_all($pattern, $content, $matches)) {
                foreach ($matches[0] as $match) {
                    // Check if it's actually problematic (uses external variables)
                    if (strpos($match, 'user') !== false || 
                        strpos($match, 'location') !== false ||
                        strpos($match, 'api') !== false) {
                        
                        $this->criticalErrors[] = [
                            'file' => basename($file),
                            'type' => 'Missing useEffect dependencies',
                            'line' => $this->getLineNumber($content, $match),
                            'description' => 'useEffect uses external variables but has empty dependency array'
                        ];
                    }
                }
            }
        }
        echo "   ✓ Checked " . count($files) . " files\n";
    }
    
    private function checkUndefinedStates() {
        echo "2. Checking undefined state initialization...\n";
        
        $files = $this->findFiles(['*.jsx', '*.js', '*.tsx', '*.ts']);
        $pattern = '/useState\(undefined\)/';
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            if (preg_match($pattern, $content)) {
                $this->warnings[] = [
                    'file' => basename($file),
                    'type' => 'Undefined state initialization',
                    'line' => $this->getLineNumber($content, 'useState(undefined)'),
                    'description' => 'State initialized with undefined - may cause unexpected behavior'
                ];
            }
        }
        echo "   ✓ Checked " . count($files) . " files\n";
    }
    
    private function checkErrorHandling() {
        echo "3. Checking error handling patterns...\n";
        
        $files = $this->findFiles(['*.jsx', '*.js', '*.tsx', '*.ts']);
        $asyncPattern = '/async\s+(function|\([^)]*\)\s*=>)/';
        $tryCatchPattern = '/try\s*\{/';
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Look for async functions without try/catch
            if (preg_match($asyncPattern, $content) && !preg_match($tryCatchPattern, $content)) {
                $basename = basename($file);
                // Filter out test files and non-component files
                if (!preg_match('/(test|spec|\.(test|spec)\.)/i', $basename) && 
                    preg_match('/(component|page|modal)/i', $basename)) {
                    
                    $this->recommendations[] = [
                        'file' => $basename,
                        'type' => 'Missing error handling',
                        'description' => 'Async function lacks try/catch error handling'
                    ];
                }
            }
        }
        echo "   ✓ Checked " . count($files) . " files\n";
    }
    
    private function checkBuildIssues() {
        echo "4. Checking for build/runtime errors...\n";
        
        // Check for common import issues
        $files = $this->findFiles(['*.jsx', '*.js', '*.tsx', '*.ts']);
        $importPattern = '/import\s+{[^}]*}\s+from\s+[\'"][^\'"]*[\'"]/';
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Check for circular dependencies (self-import)
            $basename = basename($file, '.jsx');
            $basename = basename($basename, '.js'); 
            $basename = basename($basename, '.tsx');
            $basename = basename($basename, '.ts');
            
            if (preg_match("/import[^;]*['\"]\.\/{$basename}['\"]/", $content)) {
                $this->criticalErrors[] = [
                    'file' => basename($file),
                    'type' => 'Circular dependency',
                    'description' => 'Component imports itself'
                ];
            }
        }
        echo "   ✓ Checked " . count($files) . " files\n";
    }
    
    private function checkApiIntegration() {
        echo "5. Checking API integration patterns...\n";
        
        $files = $this->findFiles(['*.jsx', '*.js', '*.tsx', '*.ts']);
        $apiPattern = '/await\s+(fetch|axios|api)/';
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Check for API calls without error handling
            if (preg_match($apiPattern, $content) && 
                !preg_match('/try\s*\{[^}]*await[^}]*\}[^}]*catch/', $content)) {
                
                $basename = basename($file);
                if (preg_match('/(component|page|modal)/i', $basename)) {
                    $this->warnings[] = [
                        'file' => $basename,
                        'type' => 'API error handling',
                        'description' => 'API call lacks proper error handling'
                    ];
                }
            }
        }
        echo "   ✓ Checked " . count($files) . " files\n";
    }
    
    private function findFiles($patterns) {
        $files = [];
        foreach ($patterns as $pattern) {
            $results = glob($this->srcDir . '/' . $pattern);
            if ($results) {
                $files = array_merge($files, $results);
            }
            
            // Also check external_components
            $extResults = glob($this->srcDir . '/external_components/' . $pattern);
            if ($extResults) {
                $files = array_merge($files, $extResults);
            }
        }
        return array_unique($files);
    }
    
    private function getLineNumber($content, $searchTerm) {
        $lines = explode("\n", $content);
        foreach ($lines as $lineNum => $line) {
            if (strpos($line, $searchTerm) !== false) {
                return $lineNum + 1;
            }
        }
        return 'Unknown';
    }
    
    private function generateReport() {
        echo "\n" . str_repeat("=", 50) . "\n";
        echo "📋 TARGETED FRONTEND ERROR REPORT\n";
        echo str_repeat("=", 50) . "\n";
        
        $totalCritical = count($this->criticalErrors);
        $totalWarnings = count($this->warnings);
        $totalRecommendations = count($this->recommendations);
        
        echo "\n🚨 CRITICAL ERRORS ({$totalCritical}):\n";
        if ($totalCritical > 0) {
            foreach ($this->criticalErrors as $error) {
                echo "  • {$error['file']} - {$error['type']}\n";
                echo "    Line {$error['line']}: {$error['description']}\n\n";
            }
        } else {
            echo "  ✅ No critical errors found!\n";
        }
        
        echo "⚠️  WARNINGS ({$totalWarnings}):\n";
        if ($totalWarnings > 0) {
            foreach ($this->warnings as $warning) {
                echo "  • {$warning['file']} - {$warning['type']}\n";
                echo "    {$warning['description']}\n\n";
            }
        } else {
            echo "  ✅ No warnings found!\n";
        }
        
        echo "💡 RECOMMENDATIONS ({$totalRecommendations}):\n";
        if ($totalRecommendations > 0) {
            foreach ($this->recommendations as $rec) {
                echo "  • {$rec['file']} - {$rec['type']}\n";
                echo "    {$rec['description']}\n\n";
            }
        } else {
            echo "  ✅ All best practices followed!\n";
        }
        
        echo "\n🎯 OVERALL ASSESSMENT:\n";
        if ($totalCritical === 0 && $totalWarnings === 0) {
            echo "✅ FRONTEND IS HEALTHY\n";
            echo "No critical issues detected. The frontend appears stable.\n";
        } elseif ($totalCritical === 0) {
            echo "⚠️  MINOR IMPROVEMENTS NEEDED\n";
            echo "Some warnings and recommendations but no critical errors.\n";
        } else {
            echo "❌ ATTENTION REQUIRED\n";
            echo "Critical errors need immediate attention.\n";
        }
        
        // Save detailed report
        $report = [
            'timestamp' => date('Y-m-d H:i:s'),
            'summary' => [
                'critical_errors' => $totalCritical,
                'warnings' => $totalWarnings,
                'recommendations' => $totalRecommendations
            ],
            'critical_errors' => $this->criticalErrors,
            'warnings' => $this->warnings,
            'recommendations' => $this->recommendations
        ];
        
        $filename = 'targeted_frontend_analysis_' . date('Y-m-d_H-i-s') . '.json';
        file_put_contents($filename, json_encode($report, JSON_PRETTY_PRINT));
        echo "\n📝 Detailed report saved to: {$filename}\n";
    }
}

// Run the targeted analysis
$checker = new TargetedFrontendChecker();
$checker->runAnalysis();
?>